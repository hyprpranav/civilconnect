import { StudentProfile, TeamFormation, TeamMember } from '../types';
import { storageService } from './storageService';

export interface SkillCategoryBreakdown {
  leadershipCount: number;
  hardwareCount: number;
  softwareCount: number;
  researchCount: number;
  presentationCount: number;
  documentationCount: number;
  logisticsCount: number;
  eventManagementCount: number;
}

export interface RecommendedTeamCandidate {
  student: StudentProfile;
  primaryRole: string;
  suitabilityScore: number;
  matchesCriteria: string[];
}

class TeamService {
  // Analyze a student's profile to extract primary and complementary roles
  public analyzeStudentSkills(student: StudentProfile): {
    roles: string[];
    isLeaderCandidate: boolean;
    hasHardware: boolean;
    hasSoftware: boolean;
    hasResearch: boolean;
    hasLogistics: boolean;
    hasPresentation: boolean;
  } {
    const skills = student.skills?.strongestSkills || [];
    const teamRoles = student.teamStrengths?.roles || [];
    const logistics = student.teamStrengths?.logisticsSkills || [];
    const activities = student.interests?.activities || [];
    const willingToLead = student.teamPreferences?.willingToLeadTeam || false;

    const isLeader = willingToLead || skills.includes('Leadership') || teamRoles.includes('Team Leader');
    const hasHardware = teamRoles.includes('Hardware Development') || skills.includes('Problem Solving');
    const hasSoftware = teamRoles.includes('Software Development') || (student.teamPreferences?.githubProfile ? true : false);
    const hasResearch = teamRoles.includes('Research and Development') || activities.includes('Research and Development');
    const hasLogistics = logistics.length > 0 || teamRoles.includes('Project Management');
    const hasPresentation = skills.includes('Public Speaking') || teamRoles.includes('Presentation and Pitching');

    return {
      roles: Array.from(new Set([...teamRoles, ...logistics])),
      isLeaderCandidate: isLeader,
      hasHardware,
      hasSoftware,
      hasResearch,
      hasLogistics,
      hasPresentation
    };
  }

  // Get aggregated skill distribution for the entire cohort
  public async getCohortSkillAnalytics(): Promise<SkillCategoryBreakdown> {
    const students = await storageService.getStudents();
    const stats: SkillCategoryBreakdown = {
      leadershipCount: 0,
      hardwareCount: 0,
      softwareCount: 0,
      researchCount: 0,
      presentationCount: 0,
      documentationCount: 0,
      logisticsCount: 0,
      eventManagementCount: 0
    };

    students.forEach(s => {
      const skills = s.skills?.strongestSkills || [];
      const roles = s.teamStrengths?.roles || [];
      const logistics = s.teamStrengths?.logisticsSkills || [];
      const activities = s.interests?.activities || [];

      if (s.teamPreferences?.willingToLeadTeam || skills.includes('Leadership') || roles.includes('Team Leader')) {
        stats.leadershipCount++;
      }
      if (roles.includes('Hardware Development')) stats.hardwareCount++;
      if (roles.includes('Software Development')) stats.softwareCount++;
      if (roles.includes('Research and Development') || activities.includes('Research and Development')) stats.researchCount++;
      if (roles.includes('Presentation and Pitching') || skills.includes('Public Speaking')) stats.presentationCount++;
      if (roles.includes('Documentation')) stats.documentationCount++;
      if (logistics.length > 0) stats.logisticsCount++;
      if (activities.includes('Event Committee Organization') || activities.includes('Event Hosting and Coordination')) {
        stats.eventManagementCount++;
      }
    });

    return stats;
  }

  // Get assigned student IDs across all active teams
  public async getAssignedStudentIds(): Promise<Set<string>> {
    const teams = await storageService.getTeams();
    const set = new Set<string>();
    teams.forEach(t => {
      t.members.forEach(m => set.add(m.studentId.toLowerCase()));
    });
    return set;
  }

  // Check team completeness and identify missing roles
  public evaluateTeamComposition(members: TeamMember[], studentProfiles: StudentProfile[]): {
    score: number; // 0 to 100
    strengths: string[];
    missingRoles: string[];
    hasLeader: boolean;
  } {
    const profileMap = new Map(studentProfiles.map(s => [s.id, s]));
    let hasLeader = false;
    let hasTech = false;
    let hasLogistics = false;
    let hasDocumentation = false;
    let hasPresentation = false;

    const strengths: string[] = [];
    const missingRoles: string[] = [];

    members.forEach(m => {
      if (m.isLeader) hasLeader = true;
      const profile = profileMap.get(m.studentId);
      if (profile) {
        const analysis = this.analyzeStudentSkills(profile);
        if (analysis.hasHardware || analysis.hasSoftware || analysis.hasResearch) hasTech = true;
        if (analysis.hasLogistics) hasLogistics = true;
        if (analysis.hasPresentation) hasPresentation = true;
        if (profile.teamStrengths?.roles.includes('Documentation')) hasDocumentation = true;
      }
    });

    if (hasLeader) strengths.push('Designated Team Leader');
    else missingRoles.push('Team Leader');

    if (hasTech) strengths.push('Technical / Engineering Core');
    else missingRoles.push('Technical / Hardware / Software Specialist');

    if (hasLogistics) strengths.push('Logistics & Operations Coordinator');
    else missingRoles.push('Logistics / Budget Coordinator');

    if (hasPresentation) strengths.push('Pitching & Presentation');
    else missingRoles.push('Presenter / Pitch Lead');

    if (hasDocumentation) strengths.push('Technical Documentation');

    let score = 20;
    if (hasLeader) score += 25;
    if (hasTech) score += 25;
    if (hasLogistics) score += 15;
    if (hasPresentation) score += 15;

    return {
      score: Math.min(100, score),
      strengths,
      missingRoles,
      hasLeader
    };
  }

  // Generate suggested complementary team draft (for Admin review)
  public async generateSuggestedTeam(
    domain: string,
    targetSize = 5
  ): Promise<{ teamName: string; projectDomain: string; members: TeamMember[] } | null> {
    const students = await storageService.getStudents();
    const assignedIds = await this.getAssignedStudentIds();
    const unassigned = students.filter(s => !assignedIds.has(s.id));

    if (unassigned.length < 3) return null;

    // Pick a leader candidate
    const leaderCandidate = unassigned.find(s => {
      const a = this.analyzeStudentSkills(s);
      return a.isLeaderCandidate;
    }) || unassigned[0];

    const teamMembers: TeamMember[] = [
      {
        studentId: leaderCandidate.id,
        registerNumber: leaderCandidate.registerNumber,
        name: leaderCandidate.name,
        department: leaderCandidate.department,
        assignedRole: 'Team Leader',
        isLeader: true
      }
    ];

    const usedIds = new Set([leaderCandidate.id]);

    // Roles to fill: Tech (Hardware/Software), Research, Presentation, Logistics
    const rolesToFill = [
      { role: 'Technical Core (Software/Hardware)', check: (s: StudentProfile) => this.analyzeStudentSkills(s).hasHardware || this.analyzeStudentSkills(s).hasSoftware },
      { role: 'Research & Domain Specialist', check: (s: StudentProfile) => this.analyzeStudentSkills(s).hasResearch },
      { role: 'Logistics & Budget Planning', check: (s: StudentProfile) => this.analyzeStudentSkills(s).hasLogistics },
      { role: 'Documentation & Pitching', check: (s: StudentProfile) => this.analyzeStudentSkills(s).hasPresentation }
    ];

    for (const req of rolesToFill) {
      if (teamMembers.length >= targetSize) break;
      const match = unassigned.find(s => !usedIds.has(s.id) && req.check(s));
      if (match) {
        teamMembers.push({
          studentId: match.id,
          registerNumber: match.registerNumber,
          name: match.name,
          department: match.department,
          assignedRole: req.role,
          isLeader: false
        });
        usedIds.add(match.id);
      }
    }

    // Fill remaining spots if needed
    for (const student of unassigned) {
      if (teamMembers.length >= targetSize) break;
      if (!usedIds.has(student.id)) {
        teamMembers.push({
          studentId: student.id,
          registerNumber: student.registerNumber,
          name: student.name,
          department: student.department,
          assignedRole: 'Team Member',
          isLeader: false
        });
        usedIds.add(student.id);
      }
    }

    const teamNames = [
      'Terra Nova Engineers',
      'Apex Structural Solutions',
      'EcoInfra Innovators',
      'Smart Grid Vanguards',
      'Urban Dynamics',
      'AeroBuild Consortium',
      'Civic Tech Pioneers',
      'Titanium Bridge Squad'
    ];
    const randomName = teamNames[Math.floor(Math.random() * teamNames.length)] + ` ${Math.floor(Math.random() * 90 + 10)}`;

    return {
      teamName: randomName,
      projectDomain: domain,
      members: teamMembers
    };
  }
}

export const teamService = new TeamService();
