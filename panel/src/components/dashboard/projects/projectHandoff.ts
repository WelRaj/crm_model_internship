export type ProjectPriority = "Low" | "Medium" | "High" | "Critical";
export type BillingModel = "Fixed Cost" | "Milestone Based" | "Monthly Retainer";
export type DeliveryMethod = "Agile" | "Waterfall" | "Hybrid";

export type ProjectTeamAssignment = {
  id: string;
  employeeId: string;
  name: string;
  role: string;
  assignedWork: string;
  startDate: string;
  endDate: string;
  priority: ProjectPriority;
  clientContactId: string;
  clientContactName: string;
  connectionNote: string;
};

export type ClientContactSnapshot = {
  id: string;
  role: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  responsibility: string;
};

export type CreatedProjectRecord = {
  id: string;
  clientId: string;
  projectId: string;
  sourceLeadId: string;
  company: string;
  projectName: string;
  projectType: string;
  projectOwner: string;
  value: number;
  primaryContact: string;
  projectManager: string;
  startDate: string;
  targetEndDate: string;
  priority: ProjectPriority;
  billingModel: BillingModel;
  deliveryMethod: DeliveryMethod;
  communicationChannel: string;
  repositoryUrl: string;
  kickoffNotes: string;
  clientContacts?: ClientContactSnapshot[];
  teamLeaderId?: string;
  teamLeaderName?: string;
  teamAssignments?: ProjectTeamAssignment[];
  status: "Planning";
  createdAt: string;
};
