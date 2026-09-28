export interface CaseContext {
  export_size_gb: number;
  concurrency: string | number;
  workload: string;
  execution_mode: string;
  problem_type: string;
}

export interface CandidateResult {
  action: string;
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  resolution_time_minutes: number;
  escalated: boolean;
  reason: string;
  lesson: string;
}

export interface SimulationResult {
  outcome: 'SUCCESS' | 'FAILURE' | 'PARTIAL';
  resolution_time_minutes: number;
  escalated: boolean;
  reason: string;
  lesson: string;
}

export interface InvestigationResult {
  identified_problem: string;
  relevant_context: Record<string, any>;
  missing_information: string[];
  ready_for_reasoning: boolean;
}

export interface Experience {
  experience_id: string;
  source: string;
  problem_type: string;
  context: CaseContext;
  diagnosis: string;
  action: string;
  outcome: string;
  status?: 'SUCCESS' | 'FAILURE' | 'PARTIAL' | 'BOUNDARY' | 'NON-TRANSFERABLE';
  lesson: string;
  applicability: Record<string, any>;
}

export interface ApplicabilityCheck {
  applicable: boolean;
  match_quality: 'HIGH' | 'MEDIUM' | 'LOW';
  transfer_confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  score: number;
  matched_conditions: string[];
  boundary_reasons: string[];
}

export interface ExperienceReasoningResult {
  candidate_results: CandidateResult[];
  applicability_states: Record<string, string>;
  changed_by_hindsight: boolean;
  decision_evidence: string[];
  recommended_action: string;
  recommendation_reason: string;
}

export interface ResolutionRecommendation {
  recommended_action: string;
  explanation?: string;
  expected_outcome?: string;
  escalation_required?: boolean;
  supporting_evidence?: string[];
  initial_action?: string;
  candidates?: CandidateResult[];
  changed_by_hindsight?: boolean;
  recommendation_reason?: string;
}

export interface GuardianResult {
  approved: boolean;
  issues: string[];
  reason?: string;
  confidence?: number;
}

export interface PipelineResult {
  status:
    | 'COMPLETE'
    | 'INVALID_INPUT'
    | 'INCOMPLETE_CASE'
    | 'INVESTIGATION_FAILED'
    | 'NO_APPLICABLE_EXPERIENCE'
    | 'DECISION_ANALYSIS_FAILED'
    | 'RESOLUTION_FAILED'
    | 'GUARDIAN_REJECTED';
  case_context?: CaseContext;
  investigation?: InvestigationResult;
  experience_reasoning?: ExperienceReasoningResult;
  resolution?: ResolutionRecommendation;
  guardian?: GuardianResult;
  final_recommendation?: string;
  changed_by_hindsight: boolean;
  decision_evidence: string[];
  simulation?: SimulationResult;
  retained_experience_id?: string | null;
  errors: string[];
}

export type LifecycleEventName =
  | 'case_started'
  | 'investigation_completed'
  | 'hindsight_recall_completed'
  | 'applicability_assessed'
  | 'reflection_completed'
  | 'simulation_completed'
  | 'guardian_validated'
  | 'recommendation_ready'
  | 'execution_started'
  | 'outcome_recorded'
  | 'experience_retained'
  | 'pipeline_completed';

export interface AgentEvent {
  step_index?: number;
  event: LifecycleEventName | string;
  agent: string;
  status: string;
  message: string;
  timestamp?: string | number;
  duration_ms?: number;
  data?: any;
}
