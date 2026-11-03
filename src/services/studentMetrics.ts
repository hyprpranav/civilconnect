import { StudentProfile } from '../types';

export interface StudentMetrics {
  total: number;
  submitted: number;
  completed: number;
  verified: number;
  pendingVerification: number;
  incomplete: number;
  active: number;
}

export function getStudentMetrics(students: StudentProfile[]): StudentMetrics {
  const activeStudents = students.filter(student => !student.isArchived);
  const submitted = activeStudents.filter(student =>
    Boolean(student.submittedAt) ||
    student.profileStatus === 'pending_review' ||
    student.profileStatus === 'verified' ||
    student.verificationStatus === 'pending' ||
    student.verificationStatus === 'verified'
  );
  const completed = activeStudents.filter(student => student.profileCompletionPercentage === 100);
  const verified = activeStudents.filter(student =>
    student.verificationStatus === 'verified' || student.profileStatus === 'verified'
  );
  const pendingVerification = activeStudents.filter(student =>
    student.verificationStatus === 'pending' || student.profileStatus === 'pending_review'
  );

  return {
    total: activeStudents.length,
    submitted: submitted.length,
    completed: completed.length,
    verified: verified.length,
    pendingVerification: pendingVerification.length,
    incomplete: activeStudents.filter(student => student.profileCompletionPercentage < 100).length,
    active: activeStudents.length
  };
}
