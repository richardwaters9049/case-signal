<?php

namespace App\Service;

use Symfony\Component\HttpFoundation\Session\SessionInterface;

final class WorkflowCaseStore
{
    private const SESSION_CASES_KEY = 'casesignal.workflow_cases';

    public function dashboard(SessionInterface $session): array
    {
        $cases = $this->cases($session);
        $activeCases = array_values(array_filter($cases, static fn (array $case): bool => !in_array($case['status'], ['Resolved', 'Rejected'], true)));
        $resolvedToday = count(array_filter($cases, static fn (array $case): bool => $case['status'] === 'Resolved'));
        $slaRisk = count(array_filter($activeCases, static fn (array $case): bool => $case['priority'] === 'High'));

        return [
            'generatedAt' => (new \DateTimeImmutable())->format(DATE_ATOM),
            'metrics' => [
                ['label' => 'Awaiting review', 'value' => count($activeCases), 'change' => sprintf('%d active workflow%s', count($activeCases), count($activeCases) === 1 ? '' : 's'), 'tone' => 'amber'],
                ['label' => 'SLA risk', 'value' => $slaRisk, 'change' => $slaRisk > 0 ? 'Needs attention' : 'Within target', 'tone' => 'rose'],
                ['label' => 'Resolved today', 'value' => $resolvedToday, 'change' => 'Recorded in audit trail', 'tone' => 'emerald'],
                ['label' => 'Workflow health', 'value' => '98.7%', 'change' => 'Live demonstration data', 'tone' => 'indigo'],
            ],
            'exceptions' => array_values($cases),
            'workflowRuns' => $this->workflowRuns($cases),
        ];
    }

    public function find(SessionInterface $session, string $caseId): ?array
    {
        return $this->cases($session)[$caseId] ?? null;
    }

    public function reset(SessionInterface $session): array
    {
        $session->remove(self::SESSION_CASES_KEY);

        return $this->dashboard($session);
    }

    public function action(SessionInterface $session, string $caseId, string $action, string $note, array $actor): array
    {
        $cases = $this->cases($session);
        $case = $cases[$caseId] ?? null;
        if ($case === null) {
            throw new \InvalidArgumentException('Case not found.');
        }

        if (in_array($case['status'], ['Resolved', 'Rejected'], true)) {
            throw new \LogicException('This case is already closed and cannot be changed.');
        }

        $transitions = [
            'approve' => ['status' => 'Resolved', 'event' => 'Approved and workflow resumed', 'message' => 'Case approved. The workflow is now ready for its next automated step.'],
            'request_information' => ['status' => 'Awaiting response', 'event' => 'Information requested', 'message' => 'Information request recorded and the workflow is waiting safely.'],
            'reject' => ['status' => 'Rejected', 'event' => 'Rejected by reviewer', 'message' => 'Case rejected and the decision has been recorded.'],
            'retry' => ['status' => 'Reprocessing', 'event' => 'Safe retry requested', 'message' => 'A safe retry has been queued with the same source evidence.'],
        ];

        if (!isset($transitions[$action])) {
            throw new \InvalidArgumentException('That workflow action is not supported.');
        }

        $transition = $transitions[$action];
        $case['status'] = $transition['status'];
        $case['owner'] = $actor['name'];
        $case['age'] = 'Just now';
        $case['updatedAt'] = (new \DateTimeImmutable())->format(DATE_ATOM);
        $case['audit'][] = [
            'at' => $case['updatedAt'],
            'actor' => $actor['name'],
            'event' => $transition['event'],
            'note' => $note !== '' ? $note : 'No additional rationale supplied.',
        ];
        $cases[$caseId] = $case;
        $session->set(self::SESSION_CASES_KEY, $cases);

        return ['case' => $case, 'message' => $transition['message']];
    }

    private function cases(SessionInterface $session): array
    {
        $cases = $session->get(self::SESSION_CASES_KEY);
        if (is_array($cases)) {
            return $cases;
        }

        $now = new \DateTimeImmutable();
        $seedCases = [
            'CS-1042' => $this->case('CS-1042', 'Missing policy number', 'Harper & Co', 'Repair request intake', 'Required evidence is missing from the email and attachment.', 'High', 'Unassigned', '18 minutes', 'Awaiting review', '0.64', 'Policy number was not found in the submitted document.', $now->modify('-18 minutes')),
            'CS-1041' => $this->case('CS-1041', 'Duplicate claim reference', 'Marlow Motors', 'Document intake', 'Two incoming documents match the same claim reference and need a reviewer decision.', 'Medium', 'Richard Waters', '31 minutes', 'Pending review', '0.71', 'The claim reference CS-88291 appears in two documents submitted within four minutes.', $now->modify('-31 minutes')),
            'CS-1039' => $this->case('CS-1039', 'Approval threshold exceeded', 'Northstar Insurance', 'Estimate validation', 'Estimated repair value exceeds the configured approval threshold.', 'High', 'Maya Singh', '42 minutes', 'Awaiting decision', '0.96', 'Estimated repair value is £8,450; the approval threshold is £5,000.', $now->modify('-42 minutes')),
            'CS-1038' => $this->case('CS-1038', 'Payment authority pending', 'Aster Property Care', 'Estimate validation', 'The estimate is valid but needs delegated authority before the payment step can continue.', 'High', 'Unassigned', '55 minutes', 'Pending approval', '0.93', 'Repair estimate is £6,280 and sits £1,280 above the delegated authority limit.', $now->modify('-55 minutes')),
            'CS-1037' => $this->case('CS-1037', 'Low extraction confidence', 'Wellington Services', 'Document intake', 'The extracted claim reference scored below the human-review threshold.', 'Medium', 'Richard Waters', '1 hour', 'In review', '0.58', 'Claim reference had two competing values in the source document.', $now->modify('-1 hour')),
            'CS-1036' => $this->case('CS-1036', 'Customer evidence requested', 'Oakwell Housing', 'Repair request intake', 'The customer must provide a clearer photograph of the damage before validation can continue.', 'Medium', 'Richard Waters', '1 hour 25 minutes', 'Awaiting response', '0.78', 'The uploaded photograph is too blurred to confirm the source and extent of the damage.', $now->modify('-85 minutes')),
            'CS-1035' => $this->case('CS-1035', 'Provider timeout retry', 'Cedar Claims', 'Document intake', 'A verified document is being retried after a transient extraction-provider timeout.', 'Medium', 'Maya Singh', '1 hour 48 minutes', 'Reprocessing', '0.99', 'The source PDF passed validation; only the extraction provider failed to respond within its limit.', $now->modify('-108 minutes')),
            'CS-1034' => $this->case('CS-1034', 'Evidence validated', 'Kingsway Repairs', 'Repair request intake', 'All required fields and policy evidence were validated.', 'Medium', 'Richard Waters', '2 hours', 'Resolved', '0.99', 'Policy evidence, claimant details and estimate were validated.', $now->modify('-2 hours')),
            'CS-1033' => $this->case('CS-1033', 'Unsupported repair category', 'Beacon Facilities', 'Estimate validation', 'The submitted repair category falls outside the policy scope.', 'High', 'Maya Singh', '2 hours 20 minutes', 'Rejected', '0.97', 'The estimate names commercial resurfacing, which is excluded from the customer policy.', $now->modify('-140 minutes')),
        ];
        $session->set(self::SESSION_CASES_KEY, $seedCases);

        return $seedCases;
    }

    private function case(string $id, string $title, string $customer, string $workflow, string $reason, string $priority, string $owner, string $age, string $status, string $confidence, string $evidence, \DateTimeImmutable $createdAt): array
    {
        return [
            'id' => $id,
            'title' => $title,
            'customer' => $customer,
            'workflow' => $workflow,
            'reason' => $reason,
            'priority' => $priority,
            'owner' => $owner,
            'age' => $age,
            'status' => $status,
            'confidence' => $confidence,
            'evidence' => $evidence,
            'source' => 'Incoming email with supporting PDF estimate',
            'createdAt' => $createdAt->format(DATE_ATOM),
            'updatedAt' => $createdAt->format(DATE_ATOM),
            'audit' => [[
                'at' => $createdAt->format(DATE_ATOM),
                'actor' => 'Workflow engine',
                'event' => 'Exception created',
                'note' => $reason,
            ]],
        ];
    }

    private function workflowRuns(array $cases): array
    {
        $workflows = ['Repair request intake', 'Document intake', 'Estimate validation'];

        return array_map(function (string $workflow) use ($cases): array {
            $workflowCases = array_filter($cases, static fn (array $case): bool => $case['workflow'] === $workflow);
            $exceptions = count(array_filter($workflowCases, static fn (array $case): bool => !in_array($case['status'], ['Resolved', 'Rejected'], true)));

            return ['name' => $workflow, 'completed' => 86 + count($workflowCases) * 20, 'exceptions' => $exceptions];
        }, $workflows);
    }
}
