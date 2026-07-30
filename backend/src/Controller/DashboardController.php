<?php

namespace App\Controller;

use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\Routing\Attribute\Route;

final class DashboardController
{
    #[Route('/api/v1/dashboard', name: 'api_dashboard', methods: ['GET', 'OPTIONS'])]
    public function dashboard(Request $request): JsonResponse
    {
        if ($request->isMethod('OPTIONS')) {
            return $this->response(null, 204);
        }

        return $this->response([
            'generatedAt' => '2026-07-30T09:00:00+01:00',
            'metrics' => [
                ['label' => 'Awaiting review', 'value' => 12, 'change' => '+3 today', 'tone' => 'amber'],
                ['label' => 'SLA risk', 'value' => 3, 'change' => 'Needs attention', 'tone' => 'rose'],
                ['label' => 'Resolved today', 'value' => 28, 'change' => '+18% this week', 'tone' => 'emerald'],
                ['label' => 'Workflow health', 'value' => '98.7%', 'change' => 'Last 24 hours', 'tone' => 'indigo'],
            ],
            'exceptions' => [
                ['id' => 'CS-1042', 'title' => 'Missing policy number', 'customer' => 'Harper & Co', 'workflow' => 'Repair request intake', 'reason' => 'Required evidence is missing from the email and attachment.', 'priority' => 'High', 'owner' => 'Unassigned', 'age' => '18 minutes', 'status' => 'Awaiting review'],
                ['id' => 'CS-1039', 'title' => 'Approval threshold exceeded', 'customer' => 'Northstar Insurance', 'workflow' => 'Estimate validation', 'reason' => 'Estimated repair value exceeds the configured approval threshold.', 'priority' => 'High', 'owner' => 'Maya Singh', 'age' => '42 minutes', 'status' => 'Awaiting decision'],
                ['id' => 'CS-1037', 'title' => 'Low extraction confidence', 'customer' => 'Wellington Services', 'workflow' => 'Document intake', 'reason' => 'The extracted claim reference scored below the human-review threshold.', 'priority' => 'Medium', 'owner' => 'Lewis Brown', 'age' => '1 hour', 'status' => 'In review'],
            ],
            'workflowRuns' => [
                ['name' => 'Repair request intake', 'completed' => 146, 'exceptions' => 4],
                ['name' => 'Document intake', 'completed' => 118, 'exceptions' => 6],
                ['name' => 'Estimate validation', 'completed' => 84, 'exceptions' => 2],
            ],
        ]);
    }

    #[Route('/health', name: 'health_check', methods: ['GET'])]
    public function health(): JsonResponse
    {
        return $this->response(['status' => 'ok']);
    }

    private function response(?array $data, int $status = 200): JsonResponse
    {
        $response = new JsonResponse($data, $status);
        $response->headers->set('Access-Control-Allow-Origin', 'http://localhost:3000');
        $response->headers->set('Access-Control-Allow-Methods', 'GET, OPTIONS');
        $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Correlation-ID');
        $response->headers->set('Vary', 'Origin');

        return $response;
    }
}
