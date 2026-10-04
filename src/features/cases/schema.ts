import { z } from 'zod'

export const caseSubmissionStep1Schema = z.object({
  departmentId: z.string().min(1, 'Please select the affected department.'),
  concernsDepartmentHead: z.boolean(),
})

export const caseSubmissionStep2Schema = z.object({
  transactionDate: z.string().min(1, 'Please select the date of the incident or transaction.'),
  purposeOfTransaction: z.string().min(1, 'Please enter the nature or purpose of the transaction.').max(255, 'Must not exceed 255 characters.'),
  amountInvolved: z.string().min(1, 'Please enter an amount in FCFA (enter 0 if non-financial).').refine(val => !isNaN(parseFloat(val)) && parseFloat(val) >= 0, 'Please enter an amount in FCFA (enter 0 if non-financial).'),
  personInvolved: z.string().min(1, 'Please specify the person or role involved.'),
})

export const caseSubmissionStep3Schema = z.object({
  description: z.string().min(10, 'Please write at least 10 characters explaining what happened.'),
  evidence: z.array(z.custom<File>((val) => val instanceof File)).min(1, 'At least one supporting file (JPG, PNG, or PDF) is required.'),
})

export const caseSubmissionSchema = z.object({
  ...caseSubmissionStep1Schema.shape,
  ...caseSubmissionStep2Schema.shape,
  ...caseSubmissionStep3Schema.shape,
})
