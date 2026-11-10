import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  GraduationCap, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Search, 
  Sparkles, 
  ArrowRight, 
  Leaf, 
  ShieldCheck, 
  Mail, 
  Phone, 
  ExternalLink,
  ChevronRight,
  X,
  RefreshCw,
  Award
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudentProfile, EventItem, EventRegistration } from '../../types';
import { storageService } from '../../services/storageService';
import { eventService, DEFAULT_SUSTAINOVA_EVENT } from '../../services/eventService';

interface SustainovaLandingPageProps {
  onNavigateHome?: () => void;
}

export const SustainovaLandingPage: React.FC<SustainovaLandingPageProps> = ({
  onNavigateHome
}) => {
  const [event, setEvent] = useState<EventItem>(DEFAULT_SUSTAINOVA_EVENT);
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [registrations, setRegistrations] = useState<EventRegistration[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState(true);

  // Registration Flow State
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [matchedStudents, setMatchedStudents] = useState<StudentProfile[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentProfile | null>(null);
  
  // Existing registration state for searched student
  const [existingReg, setExistingReg] = useState<EventRegistration | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState<boolean>(false);
  const [registeredWillingness, setRegisteredWillingness] = useState<'WILLING' | 'NOT_WILLING' | null>(null);

  useEffect(() => {
    // 1. Fetch Event Details
    eventService.getEventById('sustainova-2026').then(e => {
      if (e) setEvent(e);
    });

    // 2. Load existing students
    storageService.getStudents().then(loaded => {
      setStudents(loaded);
      setIsLoadingStudents(false);
    });

    // 3. Subscribe to registrations for real-time duplicate checks
    const unsub = eventService.subscribeToRegistrations('sustainova-2026', (regs) => {
      setRegistrations(regs);
    });

    return () => unsub();
  }, []);

  const handleOpenRegister = () => {
    setIsRegisterModalOpen(true);
    setSearchError(null);
  };

  const handleCloseRegister = () => {
    setIsRegisterModalOpen(false);
    // Keep search query or reset if succeeded
    if (registrationSuccess) {
      setSearchQuery('');
      setSelectedStudent(null);
      setMatchedStudents([]);
      setExistingReg(null);
      setRegistrationSuccess(false);
      setRegisteredWillingness(null);
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = searchQuery.trim();
    if (!query) {
      setSearchError('Please enter your Register Number, Name or Mobile Number.');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setSelectedStudent(null);
    setExistingReg(null);
    setRegistrationSuccess(false);

    try {
      const results = eventService.searchStudentsForRegistration(query, students);
      if (results.length === 0) {
        setMatchedStudents([]);
        setSearchError('No matching student found. Please verify your details.');
      } else if (results.length === 1) {
        // Direct single match
        selectStudentForVerification(results[0]);
      } else {
        // Multiple matches
        setMatchedStudents(results);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const selectStudentForVerification = async (student: StudentProfile) => {
    setSelectedStudent(student);
    setMatchedStudents([]);
    setSearchError(null);

    // Check if student is already registered for SUSTAINOVA
    const normStudent = (student.normalizedRegisterNumber || student.id || student.registerNumber).toLowerCase().trim();
    const existing = await eventService.getRegistrationForStudent(event.id, normStudent);
    if (existing) {
      setExistingReg(existing);
    } else {
      // Check in real-time registrations list
      const inList = registrations.find(r => 
        r.studentId.toLowerCase() === normStudent || 
        r.studentRegisterNumber.toLowerCase() === normStudent
      );
      setExistingReg(inList || null);
    }
  };

  const handleConfirmWillingness = async (willingness: 'WILLING' | 'NOT_WILLING') => {
    if (!selectedStudent) return;
    setIsSubmitting(true);
    setSearchError(null);

    try {
      const result = await eventService.registerStudent({
        eventId: event.id,
        student: selectedStudent,
        willingness
      });

      if (result.alreadyRegistered) {
        setExistingReg(result.registration || null);
        setSearchError('YOU HAVE ALREADY REGISTERED FOR THIS EVENT.');
      } else if (result.success && result.registration) {
        setExistingReg(result.registration);
        setRegisteredWillingness(willingness);
        setRegistrationSuccess(true);
        if (willingness === 'WILLING') {
          try {
            confetti({
              particleCount: 80,
              spread: 60,
              origin: { y: 0.6 }
            });
          } catch {}
        }
      } else {
        setSearchError(result.error || 'Failed to complete registration. Please try again.');
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Error saving registration.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FBF9F5] text-stone-900 font-sans flex flex-col selection:bg-emerald-200 selection:text-emerald-950">
      
      {/* Background Decorative Organic Eco Leaves pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#059669_1px,transparent_1px)] [background-size:24px_24px] z-0" aria-hidden="true" />
      
      {/* Subtle organic gradient glows */}
      <div className="fixed -top-40 -right-40 w-96 h-96 bg-emerald-200/40 rounded-full blur-3xl pointer-events-none z-0" />
      <div className="fixed top-1/2 -left-40 w-96 h-96 bg-lime-100/60 rounded-full blur-3xl pointer-events-none z-0" />

      {/* ========================================================= */}
      {/* A. HEADER */}
      {/* ========================================================= */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-emerald-900/10 shadow-xs">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-18 sm:h-20 flex items-center justify-between">
          
          {/* Left: Branding Suite (MKCE + ICI Logo + AAROH) */}
          <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-white p-1 border border-emerald-200 shadow-xs shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src="/ici-logo.jpg" 
                alt="ICI Sustainable Engineers Club Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs sm:text-sm font-extrabold tracking-tight text-emerald-950 leading-none">
                  MKCE
                </span>
                <span className="text-[10px] sm:text-xs text-emerald-700 font-semibold px-1.5 py-0.5 bg-emerald-50 rounded-md border border-emerald-200/60">
                  Autonomous
                </span>
              </div>
              <p className="text-[11px] sm:text-xs font-bold text-stone-700 truncate mt-0.5">
                ICI Sustainable Engineers Club
              </p>
              <p className="text-[9px] sm:text-[10px] text-stone-500 font-medium truncate">
                Under AAROH Student Club • Civil Engineering
              </p>
            </div>
          </div>

          {/* Right: Simple Navigation */}
          <nav className="flex items-center gap-4 sm:gap-6 text-xs sm:text-sm font-semibold text-stone-700">
            <a 
              href="/" 
              onClick={(e) => {
                if (onNavigateHome) {
                  e.preventDefault();
                  onNavigateHome();
                }
              }}
              className="hover:text-emerald-700 transition-colors py-1 cursor-pointer"
            >
              Home
            </a>
            <a 
              href="#about" 
              className="hover:text-emerald-700 transition-colors py-1 hidden xs:inline-block"
            >
              About
            </a>
            <a 
              href="#contact" 
              className="hover:text-emerald-700 transition-colors py-1 hidden sm:inline-block"
            >
              Contact
            </a>
            <button
              onClick={handleOpenRegister}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
            >
              <span>Register</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </header>

      {/* ========================================================= */}
      {/* B. HERO SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 pt-10 pb-14 sm:pt-16 sm:pb-20 px-4 sm:px-6 max-w-5xl mx-auto text-center">
        
        {/* Organizer Badges */}
        <div className="inline-flex flex-wrap items-center justify-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold mb-6 shadow-2xs">
          <Leaf className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
          <span>ICI Sustainable Engineers Club</span>
          <span className="text-emerald-400">•</span>
          <span>Under AAROH Student Club, MKCE</span>
        </div>

        {/* Main Event Title */}
        <h1 className="text-4xl xs:text-5xl sm:text-6xl md:text-7xl font-black text-emerald-950 tracking-tight leading-tight">
          SUSTAINOVA
        </h1>

        {/* Subtitle */}
        <p className="mt-4 text-lg xs:text-xl sm:text-2xl font-bold text-emerald-800 max-w-3xl mx-auto leading-snug">
          Sustainable Innovation for Infrastructure and Industry
        </p>

        {/* Short value highlight */}
        <p className="mt-3 text-sm sm:text-base text-stone-600 max-w-2xl mx-auto leading-relaxed">
          A dedicated institutional symposium exploring future-proof green infrastructure, circular building systems, eco-friendly concrete technologies, and sustainable industrial frameworks.
        </p>

        {/* Prominent Green CTA Button */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={handleOpenRegister}
            className="w-full sm:w-auto px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl shadow-emerald-700/20 hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2.5 cursor-pointer ring-4 ring-emerald-600/10"
          >
            <Sparkles className="w-5 h-5 text-emerald-200" />
            <span>CLICK HERE TO REGISTER</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Quick event highlights ribbon */}
        <div className="mt-8 inline-flex flex-wrap items-center justify-center gap-4 text-xs font-semibold text-stone-600 bg-white/80 backdrop-blur-xs py-2 px-4 rounded-xl border border-stone-200/80 shadow-2xs">
          <span className="flex items-center gap-1.5 text-emerald-800">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" /> 11 Nov 2026
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-emerald-800">
            <Clock className="w-3.5 h-3.5 text-emerald-600" /> 09:00 AM – 04:00 PM
          </span>
          <span>•</span>
          <span className="flex items-center gap-1.5 text-emerald-800">
            <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Ramanujan Hall, MKCE
          </span>
        </div>
      </section>

      {/* ========================================================= */}
      {/* C. EVENT INFORMATION SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-10 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="text-center mb-8">
          <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Event Overview
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-stone-900 mt-1">
            Official Workshop Details
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Card: Schedule & Venue */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-emerald-900/10 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-emerald-800 flex items-center justify-center shrink-0">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Event Schedule & Location</h3>
                <p className="text-xs text-stone-500">Essential timing and venue details</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start justify-between py-2 border-b border-stone-100">
                <span className="font-semibold text-stone-500">Event Name:</span>
                <span className="font-bold text-emerald-900 text-right">SUSTAINOVA</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-stone-100">
                <span className="font-semibold text-stone-500">Event Date:</span>
                <span className="font-bold text-stone-900 text-right">11 November 2026</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-stone-100">
                <span className="font-semibold text-stone-500">Event Time:</span>
                <span className="font-bold text-stone-900 text-right">09:00 AM – 04:00 PM</span>
              </div>
              <div className="flex items-start justify-between py-2">
                <span className="font-semibold text-stone-500">Venue:</span>
                <span className="font-bold text-emerald-800 text-right flex items-center gap-1 justify-end">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Ramanujan Hall, MKCE
                </span>
              </div>
            </div>
          </div>

          {/* Right Card: Resource Person */}
          <div className="bg-white rounded-2xl p-6 sm:p-7 border border-emerald-900/10 shadow-xs space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-lime-100/80 text-lime-900 flex items-center justify-center shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-stone-900">Resource Person</h3>
                <p className="text-xs text-stone-500">Distinguished expert delivering the workshop</p>
              </div>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm">
              <div className="flex items-start justify-between py-2 border-b border-stone-100">
                <span className="font-semibold text-stone-500">Resource Person:</span>
                <span className="font-extrabold text-stone-900 text-right">Dr. G. Balaji</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-stone-100">
                <span className="font-semibold text-stone-500">Designation:</span>
                <span className="font-bold text-stone-800 text-right">Assistant Professor & HoD</span>
              </div>
              <div className="flex items-start justify-between py-2 border-b border-stone-100">
                <span className="font-semibold text-stone-500">Department:</span>
                <span className="font-bold text-emerald-900 text-right">Civil Engineering, MKCE</span>
              </div>
              <div className="flex items-start justify-between py-2">
                <span className="font-semibold text-stone-500">Host Organization:</span>
                <span className="font-bold text-stone-700 text-right">ICI Sustainable Engineers Club</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* D. ABOUT SECTION */}
      {/* ========================================================= */}
      <section id="about" className="relative z-10 py-10 px-4 sm:px-6 max-w-5xl mx-auto w-full">
        <div className="bg-gradient-to-br from-emerald-900 to-teal-950 text-white rounded-3xl p-6 sm:p-10 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-800/60 text-emerald-200 text-xs font-semibold mb-4 border border-emerald-700/50">
              <Leaf className="w-3.5 h-3.5 text-emerald-300" />
              <span>Workshop Focus & Objectives</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-4">
              About SUSTAINOVA 2026
            </h2>

            <p className="text-sm sm:text-base text-emerald-100/90 leading-relaxed space-y-3 font-normal">
              SUSTAINOVA brings together aspiring student engineers and innovators to address critical challenges in modern infrastructure and industrial sustainability. The session equips participants with actionable insights into low-carbon building materials, renewable lifecycle design, sustainable concrete matrixes, and smart environmental stewardship aligned with global green engineering standards.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-emerald-800/60 text-xs text-emerald-200">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Green Infrastructure Design</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Circular Industrial Materials</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Department Attendance Credit</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* E. REGISTRATION SECTION */}
      {/* ========================================================= */}
      <section className="relative z-10 py-12 px-4 sm:px-6 max-w-4xl mx-auto w-full text-center">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-emerald-900/10 shadow-sm space-y-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
            <Leaf className="w-7 h-7" />
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold text-stone-900">
            Join the Movement for Sustainable Infrastructure
          </h2>

          <p className="text-xs sm:text-sm text-stone-600 max-w-xl mx-auto leading-relaxed">
            Existing MKCE students across departments are invited to confirm their participation. Registration requires verifying your student record from the institutional database.
          </p>

          <div className="pt-2">
            <button
              onClick={handleOpenRegister}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-lg hover:shadow-xl shadow-emerald-700/20 hover:-translate-y-0.5 active:translate-y-0 transition-all inline-flex items-center gap-2.5 cursor-pointer ring-4 ring-emerald-600/10"
            >
              <Sparkles className="w-5 h-5 text-emerald-200" />
              <span>CLICK HERE TO REGISTER</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* F. FOOTER */}
      {/* ========================================================= */}
      <footer id="contact" className="relative z-10 mt-auto bg-stone-900 text-stone-300 border-t border-stone-800 py-10 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            
            {/* Col 1: Club Info */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <img 
                  src="/ici-logo.jpg" 
                  alt="ICI Logo" 
                  className="w-9 h-9 rounded-xl bg-white p-0.5 object-contain"
                />
                <div>
                  <h4 className="text-sm font-bold text-white">ICI Sustainable Engineers Club</h4>
                  <p className="text-[11px] text-emerald-400">Under AAROH Student Club</p>
                </div>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed">
                Empowering future civil and multidisciplinary engineers at M.Kumarasamy College of Engineering through sustainable development initiatives and technical innovation.
              </p>
            </div>

            {/* Col 2: Institutional Dept */}
            <div className="space-y-2 text-xs">
              <h4 className="text-sm font-bold text-white">Civil Engineering Department</h4>
              <p className="text-stone-400 leading-relaxed">
                M.Kumarasamy College of Engineering (Autonomous)<br />
                Thalavapalayam, Karur – 639 113, Tamil Nadu, India.
              </p>
              <div className="pt-1 flex items-center gap-2 text-stone-400">
                <Mail className="w-3.5 h-3.5 text-emerald-400" />
                <span>civil@mkce.ac.in</span>
              </div>
            </div>

            {/* Col 3: Social & Portal Links */}
            <div className="space-y-3 text-xs">
              <h4 className="text-sm font-bold text-white">Connect & Follow</h4>
              <div className="flex items-center gap-3">
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-emerald-900 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                  aria-label="Instagram"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="w-8 h-8 rounded-xl bg-stone-800 hover:bg-emerald-900 text-stone-300 hover:text-white flex items-center justify-center transition-colors"
                  aria-label="LinkedIn"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                </a>
                <a 
                  href="/" 
                  onClick={(e) => {
                    if (onNavigateHome) {
                      e.preventDefault();
                      onNavigateHome();
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-white font-semibold flex items-center gap-1.5"
                >
                  <span>Civil Connect Portal</span>
                  <ExternalLink className="w-3 h-3 text-emerald-400" />
                </a>
              </div>
              <p className="text-[11px] text-stone-500">
                Official registration module for SUSTAINOVA 2026.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-stone-500">
            <span>© 2026 SUSTAINOVA • ICI Sustainable Engineers Club & AAROH Club • MKCE</span>
            <span>All existing student records protected & preserved.</span>
          </div>
        </div>
      </footer>

      {/* ========================================================= */}
      {/* STUDENT REGISTRATION INTERFACE MODAL / DRAWER */}
      {/* ========================================================= */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[92vh] flex flex-col overflow-hidden border border-emerald-900/10">
            
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 to-teal-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  <Leaf className="w-4 h-4 text-emerald-300" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm sm:text-base font-bold truncate leading-tight">
                    SUSTAINOVA 2026 Registration
                  </h3>
                  <p className="text-[11px] text-emerald-200 truncate">
                    Student Search & Participation Confirmation
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseRegister}
                className="p-1.5 text-emerald-200 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                aria-label="Close registration modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
              
              {/* Step 1: Search Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-stone-700">
                  Verify Your Student Record
                </label>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Enter your Register Number, Name or Mobile Number"
                      className="w-full pl-9 pr-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm text-stone-900 focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
                      autoFocus
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isSearching || isLoadingStudents}
                    className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-bold rounded-xl shadow-xs transition-colors shrink-0 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                  >
                    {isSearching ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <span>Search</span>
                    )}
                  </button>
                </form>
                <p className="text-[11px] text-stone-500">
                  Searches directly against the institutional roster (~98 students).
                </p>
              </div>

              {/* Error / Not Found Message */}
              {searchError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2.5 text-rose-800 text-xs animate-shake">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 font-semibold">
                    {searchError}
                  </div>
                </div>
              )}

              {/* Multiple Matches Disambiguation */}
              {matchedStudents.length > 1 && (
                <div className="space-y-2.5 bg-amber-50/70 border border-amber-200 p-3.5 rounded-2xl">
                  <div className="flex items-center gap-2 text-amber-900 text-xs font-bold">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Multiple records match "{searchQuery}". Please select your Register Number:</span>
                  </div>
                  <div className="space-y-1.5 max-h-48 overflow-y-auto">
                    {matchedStudents.map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => selectStudentForVerification(st)}
                        className="w-full p-2.5 bg-white hover:bg-emerald-50 border border-amber-200/80 hover:border-emerald-300 rounded-xl text-left text-xs transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="font-extrabold text-stone-900 group-hover:text-emerald-900">
                            {st.name}
                          </div>
                          <div className="text-[11px] text-stone-500">
                            Reg No: <span className="font-mono font-bold text-stone-700">{st.registerNumber}</span> • {st.department}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Verified Student Information Card */}
              {selectedStudent && (
                <div className="space-y-4">
                  <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-900">
                          Verified Student Record
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full border border-emerald-300">
                        MKCE Student
                      </span>
                    </div>

                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex justify-between items-center py-1 border-b border-emerald-100/60">
                        <span className="text-stone-500 font-medium">Student Name:</span>
                        <span className="font-extrabold text-stone-900 text-right">{selectedStudent.name}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-emerald-100/60">
                        <span className="text-stone-500 font-medium">Register Number:</span>
                        <span className="font-mono font-bold text-emerald-950 text-right">{selectedStudent.registerNumber}</span>
                      </div>
                      <div className="flex justify-between items-center py-1 border-b border-emerald-100/60">
                        <span className="text-stone-500 font-medium">Department:</span>
                        <span className="font-semibold text-stone-800 text-right">{selectedStudent.department}</span>
                      </div>
                      {selectedStudent.academicYear && (
                        <div className="flex justify-between items-center py-1">
                          <span className="text-stone-500 font-medium">Academic Year:</span>
                          <span className="font-semibold text-stone-800 text-right">{selectedStudent.academicYear}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Duplicate Registration Warning */}
                  {existingReg && !registrationSuccess && (
                    <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-2xl space-y-2 text-center">
                      <div className="inline-flex items-center gap-1.5 text-xs font-black text-amber-900 uppercase tracking-wide">
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                        <span>YOU HAVE ALREADY REGISTERED FOR THIS EVENT.</span>
                      </div>
                      <p className="text-xs text-amber-800">
                        Response recorded:{' '}
                        <span className="font-extrabold text-stone-900">
                          {existingReg.willingness === 'WILLING' ? "YES, I'M WILLING TO JOIN" : 'NOT WILLING TO PARTICIPATE'}
                        </span>
                      </p>
                      <p className="text-[11px] text-stone-500">
                        Registered at: {new Date(existingReg.registeredAt).toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] text-amber-700 italic">
                        Contact the event administrator for assistance if a correction is required.
                      </p>
                    </div>
                  )}

                  {/* Step 3: Willingness Confirmation (Shown only if NOT already registered) */}
                  {!existingReg && !registrationSuccess && (
                    <div className="space-y-4 pt-1">
                      
                      {/* Notice */}
                      <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-2xl text-[11px] text-stone-600 leading-relaxed">
                        <span className="font-bold text-stone-800 block mb-1">
                          Important Notice:
                        </span>
                        Please confirm your participation carefully. Once submitted, your registration cannot be changed or withdrawn through the student registration page. Contact the event administrator for assistance if a correction is required.
                      </div>

                      {/* Question */}
                      <p className="text-xs sm:text-sm font-extrabold text-stone-900 text-center">
                        Are you willing to participate in SUSTAINOVA?
                      </p>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-2.5">
                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleConfirmWillingness('WILLING')}
                          className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                          <span>YES, I'M WILLING TO JOIN</span>
                        </button>

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleConfirmWillingness('NOT_WILLING')}
                          className="py-3 px-4 bg-stone-100 hover:bg-stone-200 active:bg-stone-300 text-stone-700 font-bold text-xs sm:text-sm rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                        >
                          <XCircle className="w-4 h-4 text-stone-500" />
                          <span>NOT WILLING TO PARTICIPATE</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Success Message */}
                  {registrationSuccess && (
                    <div className="p-5 bg-emerald-50 border-2 border-emerald-500 rounded-2xl text-center space-y-3 animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-md">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <h4 className="text-base font-extrabold text-emerald-950">
                        {registeredWillingness === 'WILLING' 
                          ? 'Congratulations! You have successfully registered for SUSTAINOVA.' 
                          : 'Your response (Not Willing) has been recorded.'}
                      </h4>
                      <p className="text-xs text-stone-600">
                        Student: <span className="font-bold text-stone-900">{selectedStudent.name}</span> ({selectedStudent.registerNumber})
                      </p>
                      <p className="text-[11px] text-emerald-800">
                        Event Date: 11 November 2026 • Ramanujan Hall, MKCE
                      </p>
                      <button
                        type="button"
                        onClick={handleCloseRegister}
                        className="mt-2 px-6 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        Done
                      </button>
                    </div>
                  )}

                </div>
              )}

            </div>

            {/* Modal Footer */}
            <div className="p-3.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" /> Verified Student Access
              </span>
              <button
                type="button"
                onClick={handleCloseRegister}
                className="text-stone-600 hover:text-stone-900 font-semibold cursor-pointer"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

