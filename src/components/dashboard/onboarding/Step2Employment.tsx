"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { ArrowRight, ArrowLeft } from "lucide-react";

export default function Step2Employment({ data, updateData, onNext, onPrev }: any) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    updateData({ ...data, [name]: value });
  };

  const departments = ["Product Engineering", "Design", "Quality Assurance", "People Operations", "Client Growth", "Finance", "Growth Marketing"];

  const designationMapping: Record<string, string[]> = {
    "Product Engineering": ["Frontend Developer", "Backend Developer", "Full Stack Developer", "Mobile App Developer", "DevOps Engineer"],
    "Design": ["UI Designer", "UX Designer", "Product Designer", "Graphic Designer"],
    "Quality Assurance": ["Manual Tester", "Automation Engineer", "QA Lead", "Security Tester"],
    "People Operations": ["People Operations Manager", "Recruiter", "HR Executive", "Operations Manager"],
    "Client Growth": ["Sales Executive", "Business Development Manager", "Account Manager"],
    "Finance": ["Accountant", "Finance Controller", "Billing Executive"],
    "Growth Marketing": ["Digital Marketer", "SEO Specialist", "Content Writer", "Social Media Manager"]
  };

  const employeeTypes = ["Permanent", "Contract", "Intern"];
  const locations = ["Office", "Remote", "Hybrid"];
  const shifts = ["Morning", "Evening", "Night", "Flexible"];
  const probations = ["3 Months", "6 Months"];
  const statuses = ["Active", "Inactive", "On Hold"];

  const currentDesignations = data.department ? designationMapping[data.department] || [] : [];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-1">
          <Input
            label="Department"
            name="department"
            value={data.department}
            list="departments-list"
            placeholder="Enter or select department"
            showEditIcon={true}
            onChange={(e) => {
              handleChange(e);
              updateData({ ...data, department: e.target.value, designation: "" });
            }}
            required
          />
          <datalist id="departments-list">
            {departments.map((dept) => (
              <option key={dept} value={dept} />
            ))}
          </datalist>
        </div>

        <div className="space-y-1">
          <Input
            label="Designation"
            name="designation"
            value={data.designation}
            list="designations-list"
            placeholder="Enter or select designation"
            showEditIcon={true}
            onChange={handleChange}
            required
          />
          <datalist id="designations-list">
            {currentDesignations.map((des) => (
              <option key={des} value={des} />
            ))}
          </datalist>
        </div>

        <Select
          label="Employee Type"
          name="employeeType"
          value={data.employeeType}
          options={employeeTypes}
          onChange={handleChange}
          required
        />

        <Input label="Reporting Manager" name="reportingManager" value={data.reportingManager} onChange={handleChange} required />

        <Input label="Date of Joining" type="date" name="doj" value={data.doj} onChange={handleChange} required />

        <Select
          label="Work Location"
          name="workLocation"
          value={data.workLocation}
          options={locations}
          onChange={handleChange}
          required
        />

        <Select
          label="Shift Timing"
          name="shiftTiming"
          value={data.shiftTiming}
          options={shifts}
          onChange={handleChange}
          required
        />

        <div className="space-y-1">
          <Input
            label="Probation Period"
            name="probationPeriod"
            value={data.probationPeriod}
            list="probations-list"
            placeholder="Enter or select probation"
            showEditIcon={true}
            onChange={handleChange}
            required
          />
          <datalist id="probations-list">
            {probations.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </div>

        <Input label="Official Company Email" type="email" name="officialEmail" value={data.officialEmail} onChange={handleChange} required />

        <Select
          label="Employee Status"
          name="status"
          value={data.status}
          options={statuses}
          onChange={handleChange}
          required
        />
      </div>

      <div className="flex justify-between pt-8">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Button onClick={onNext}>
          Save & Next <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
