<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\HttpFoundation\Session\SessionInterface;
use Symfony\Component\Routing\Attribute\Route;
use App\Service\WorkflowCaseStore;

final class CaseSignalController
{
    private const DEMO_EMAIL = 'richard@casesignal.local';
    private const DEMO_PASSWORD_HASH = '$argon2id$v=19$m=65536,t=4,p=1$RjdnMG1CZGFrMVpTN2lIZg$+S7llJgLq+ZcaypWD8R5B75xJiMmoAP4285l8oEEHmc';
    private const SESSION_USER_KEY = 'casesignal.user';

    public function __construct(private readonly WorkflowCaseStore $caseStore)
    {
    }

    #[Route('/api/v1/auth/login', name: 'api_auth_login', methods: ['POST', 'OPTIONS'])]
    public function login(Request $request): JsonResponse
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->response(null, Response::HTTP_NO_CONTENT);
        }

        try {
            $payload = $request->toArray();
        } catch (\JsonException) {
            return $this->problem('invalid_request', 'Enter a valid email address and password.', Response::HTTP_BAD_REQUEST);
        }

        $email = isset($payload['email']) && is_string($payload['email']) ? mb_strtolower(trim($payload['email'])) : '';
        $password = isset($payload['password']) && is_string($payload['password']) ? $payload['password'] : '';

        if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') {
            return $this->problem('invalid_credentials', 'Enter a valid email address and password.', Response::HTTP_UNAUTHORIZED);
        }

        if (!hash_equals(self::DEMO_EMAIL, $email) || !password_verify($password, self::DEMO_PASSWORD_HASH)) {
            return $this->problem('invalid_credentials', 'Your email address or password is incorrect.', Response::HTTP_UNAUTHORIZED);
        }

        $session = $request->getSession();
        $session->migrate(true);
        $session->set(self::SESSION_USER_KEY, $this->demoUser());

        return $this->response(['user' => $this->demoUser()], Response::HTTP_OK);
    }

    #[Route('/api/v1/auth/me', name: 'api_auth_me', methods: ['GET', 'OPTIONS'])]
    public function currentUser(Request $request): JsonResponse
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->response(null, Response::HTTP_NO_CONTENT);
        }

        $user = $this->authenticatedUser($request->getSession());
        if ($user === null) {
            return $this->problem('authentication_required', 'Sign in to access CaseSignal.', Response::HTTP_UNAUTHORIZED);
        }

        return $this->response(['user' => $user], Response::HTTP_OK);
    }

    #[Route('/api/v1/auth/logout', name: 'api_auth_logout', methods: ['POST', 'OPTIONS'])]
    public function logout(Request $request): JsonResponse
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->response(null, Response::HTTP_NO_CONTENT);
        }

        $request->getSession()->invalidate();

        return $this->response(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/api/v1/dashboard', name: 'api_dashboard', methods: ['GET', 'OPTIONS'])]
    public function dashboard(Request $request): JsonResponse
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->response(null, Response::HTTP_NO_CONTENT);
        }

        if ($this->authenticatedUser($request->getSession()) === null) {
            return $this->problem('authentication_required', 'Sign in to access the dashboard.', Response::HTTP_UNAUTHORIZED);
        }

        return $this->response($this->caseStore->dashboard($request->getSession()));
    }

    #[Route('/api/v1/cases/{caseId}', name: 'api_case_detail', methods: ['GET', 'OPTIONS'])]
    public function caseDetail(Request $request, string $caseId): JsonResponse
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->response(null, Response::HTTP_NO_CONTENT);
        }

        if ($this->authenticatedUser($request->getSession()) === null) {
            return $this->problem('authentication_required', 'Sign in to view this case.', Response::HTTP_UNAUTHORIZED);
        }

        $case = $this->caseStore->find($request->getSession(), $caseId);
        if ($case === null) {
            return $this->problem('case_not_found', 'This case could not be found.', Response::HTTP_NOT_FOUND);
        }

        return $this->response(['case' => $case]);
    }

    #[Route('/api/v1/cases/{caseId}/actions', name: 'api_case_action', methods: ['POST', 'OPTIONS'])]
    public function caseAction(Request $request, string $caseId): JsonResponse
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->response(null, Response::HTTP_NO_CONTENT);
        }

        $user = $this->authenticatedUser($request->getSession());
        if ($user === null) {
            return $this->problem('authentication_required', 'Sign in to update this case.', Response::HTTP_UNAUTHORIZED);
        }

        try {
            $payload = $request->toArray();
        } catch (\JsonException) {
            return $this->problem('invalid_request', 'Provide a valid workflow action.', Response::HTTP_BAD_REQUEST);
        }

        $action = $payload['action'] ?? null;
        $note = $payload['note'] ?? '';
        if (!is_string($action) || !is_string($note) || mb_strlen($note) > 500) {
            return $this->problem('invalid_request', 'Provide a supported action and a rationale of up to 500 characters.', Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        try {
            return $this->response($this->caseStore->action($request->getSession(), $caseId, $action, trim($note), $user));
        } catch (\InvalidArgumentException $exception) {
            return $this->problem('case_not_found', $exception->getMessage(), Response::HTTP_NOT_FOUND);
        } catch (\LogicException $exception) {
            return $this->problem('invalid_transition', $exception->getMessage(), Response::HTTP_CONFLICT);
        }
    }

    #[Route('/health', name: 'health_check', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return $this->response(['status' => 'ok']);
    }

    private function authenticatedUser(SessionInterface $session): ?array
    {
        $user = $session->get(self::SESSION_USER_KEY);

        return is_array($user) ? $user : null;
    }

    private function demoUser(): array
    {
        return [
            'id' => 'usr_richard_waters',
            'name' => 'Richard Waters',
            'email' => self::DEMO_EMAIL,
            'role' => 'Workflow engineer',
            'initials' => 'RW',
        ];
    }

    private function problem(string $code, string $detail, int $status): JsonResponse
    {
        $response = $this->response([
            'type' => sprintf('https://casesignal.local/problems/%s', $code),
            'title' => 'Request could not be completed',
            'status' => $status,
            'detail' => $detail,
            'code' => $code,
        ], $status);
        $response->headers->set('Content-Type', 'application/problem+json');

        return $response;
    }

    private function response(?array $data, int $status = Response::HTTP_OK): JsonResponse
    {
        $response = new JsonResponse($data, $status);
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:3000');
        $response->headers->set('Access-Control-Allow-Credentials', 'true');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
        $response->headers->set('Cache-Control', 'no-store');
        $response->headers->set('Vary', 'Origin');

        return $response;
    }
}
