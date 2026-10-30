import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  CheckCircle2,
  XCircle,
  Mail,
  Copy,
  ExternalLink,
  RotateCcw,
  Check,
  ChevronRight,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

interface Message {
  id: string;
  sender: 'bot' | 'user';
  text: string;
  timestamp: string;
  troubleshootData?: TroubleshootSolution;
  solvedState?: 'unanswered' | 'solved' | 'unsolved';
  showEscalation?: boolean;
}

interface TroubleshootSolution {
  id: string;
  category: string;
  title: string;
  severity: 'info' | 'warning' | 'error';
  cause: string;
  steps: string[];
  preventativeTip?: string;
  targetTab?: string;
  actionLabel?: string;
}

interface ErrorTroubleshooterBotProps {
  onNavigateTab?: (tab: string) => void;
  initialQuery?: string;
}

const SUPPORT_EMAIL = 'eswar@sierraedge.ai';

const KNOWLEDGE_BASE: TroubleshootSolution[] = [
  {
    id: 'cutoff_10pm',
    category: 'Daily Updates & Cutoff',
    title: 'Updates Locked After 10:00 PM Cutoff',
    severity: 'warning',
    cause:
      'Sierra Team Hub enforces a strict 10:00 PM auto-lock rule across all work updates to maintain compliance and uniform daily reporting standards.',
    steps: [
      'Morning Updates must be submitted between 9:00 AM and 12:00 PM.',
      'Evening Updates must be submitted between 4:00 PM and 10:00 PM.',
      'Once the clock hits 10:00 PM, all submission and editing forms for today are permanently locked.',
      'If you missed the cutoff due to urgent client delivery, technical outage, or emergency, contact your Project Lead or an Admin to grant an unlock or record an manual entry.',
      'Check your computer time and timezone setting to ensure it matches the server timezone.',
    ],
    preventativeTip:
      'Set an alarm for 5:30 PM each day to submit your evening update right as you wrap up work, rather than waiting until 10 PM.',
    targetTab: 'dashboard',
    actionLabel: 'Check Dashboard Status',
  },
  {
    id: 'project_access_403',
    category: 'Permissions & Access',
    title: '403 Forbidden / Not Assigned to Project',
    severity: 'error',
    cause:
      'You are attempting to access, update tasks, or submit updates for a project that you are not currently assigned to or member of.',
    steps: [
      'Go to the "Projects" page from the left navigation sidebar.',
      'Find the project you need to work on in the project list.',
      'Click the "Request to Join" or "Request Access" button on the project card.',
      'The Project Owner or Admin receives an instant notification to review and approve your membership request.',
      'Once approved, reload the page and the project tasks will become available on your Task Board and Update dropdowns.',
    ],
    preventativeTip:
      'Ask your project manager to assign you to the project during onboarding or sprint planning.',
    targetTab: 'projects',
    actionLabel: 'Go to Projects Page',
  },
  {
    id: 'auth_session_401',
    category: 'Authentication',
    title: '401 Unauthorized / Session Expired',
    severity: 'error',
    cause:
      'Your authentication security token has expired, or your user account status was modified on the server.',
    steps: [
      'Click on your user avatar in the top-right corner of the screen.',
      'Select "Sign Out" to clear the stale session credentials.',
      'Log back in using your registered email and current password.',
      'If you recently changed your password, make sure you are not using an old password autofilled by your browser.',
      'If login fails repeatedly, clear browser storage/cookies for this site and try again.',
    ],
    preventativeTip:
      'Avoid opening multiple sessions across different devices or incognito windows simultaneously.',
  },
  {
    id: 'attachment_upload_failed',
    category: 'Tasks & Uploads',
    title: 'Task Attachment Upload Failed',
    severity: 'warning',
    cause:
      'File size exceeds the 10 MB limit, format is unsupported, or an active network interruption occurred during upload.',
    steps: [
      'Check that your file size is strictly under 10 Megabytes (MB).',
      'Supported file formats include: PNG, JPG, JPEG, WEBP, PDF, DOCX, XLSX, and ZIP.',
      'If you have large screen recordings or code bundles (>10MB), upload them to Google Drive or SharePoint and paste the shared link in the task completion comment.',
      'Ensure your internet connection is active and stable before retrying the upload.',
    ],
    preventativeTip:
      'Compress images and PDFs using built-in compression tools before attaching.',
    targetTab: 'tasks',
    actionLabel: 'Open Task Board',
  },
  {
    id: 'leave_balance_error',
    category: 'Leave & Attendance',
    title: 'Leave Request Denied / Insufficient Balance',
    severity: 'warning',
    cause:
      'Your requested leave dates exceed your available monthly leave balance, overlap with an existing request, or have invalid dates.',
    steps: [
      'Navigate to "Leave & Requests" and inspect your Leave Balance counters at the top.',
      'Verify that your Start Date is equal to or before your End Date.',
      'Check your calendar to ensure you do not already have an existing approved or pending request for the same date range.',
      'Ensure you have selected the appropriate request type: Standard Leave, Work From Home (WFH), or Work From Branch Office (WFBO).',
      'If your balance counter is zero or incorrect due to a balance accrual discrepancy, contact your HR Admin.',
    ],
    preventativeTip:
      'Submit leave requests at least 48 hours in advance so managers can review coverage.',
    targetTab: 'leave',
    actionLabel: 'View Leave & Requests',
  },
  {
    id: 'network_500_fetch',
    category: 'Network & Server',
    title: 'Network Error / Failed to Fetch / 500 Server Error',
    severity: 'error',
    cause:
      'The browser failed to communicate with the Sierra Team Hub backend API, or the server encountered an unexpected error.',
    steps: [
      'Check whether your internet connection is active and stable.',
      'Perform a hard refresh: Press Ctrl+F5 on Windows/Linux or Cmd+Shift+R on Mac.',
      'If your company uses a VPN or corporate firewall, verify it does not block the backend API endpoints.',
      'Check browser console (Press F12 -> Console) to see if there is a specific network or CORS error.',
      'Wait 1-2 minutes and retry in case the backend server was restarting or deploying an update.',
    ],
    preventativeTip:
      'If the issue persists for more than 5 minutes, email eswar@sierraedge.ai with a screenshot of the error.',
  },
  {
    id: 'duplicate_morning_update',
    category: 'Daily Updates',
    title: 'Morning Update Already Submitted for Today',
    severity: 'info',
    cause:
      'The system records exactly one primary morning plan per employee per day to preserve clean attendance tracking.',
    steps: [
      'Check your Dashboard to view the morning update you previously submitted for today.',
      'If you need to log additional tasks or changes in plan during the day, add or update tasks on the Task Board.',
      'In the evening between 4:00 PM and 10:00 PM, you can document any deviations or new work in your Evening Update under "Completed Work" and "Challenges".',
      'If you made an accidental error in your morning plan, contact your Admin to unlock or adjust the entry.',
    ],
    targetTab: 'dashboard',
    actionLabel: 'View Today on Dashboard',
  },
  {
    id: 'evening_update_early',
    category: 'Daily Updates',
    title: 'Cannot Submit Evening Update Before 4:00 PM',
    severity: 'info',
    cause:
      'The Evening Update window opens strictly at 4:00 PM and closes at 10:00 PM to ensure accurate full-day work reporting.',
    steps: [
      'Evening Updates can only be submitted between 4:00 PM and 10:00 PM.',
      'If you are leaving work early (e.g. half-day), submit an approved Half-Day or Leave request on the Leave page.',
      'Ensure you log your total hours worked (typically 7-9 hours) and specify tomorrow\'s plan before 10:00 PM.',
    ],
  },
  {
    id: 'password_change_error',
    category: 'Security & Profile',
    title: 'Password Change Error / Failed to Update',
    severity: 'warning',
    cause:
      'The current password was typed incorrectly, the new password is shorter than 6 characters, or the passwords do not match.',
    steps: [
      'Click your user avatar in the top right and open "Change Password" (or navigate to Settings > Security).',
      'Enter your current password carefully (passwords are case sensitive).',
      'Enter a new password of at least 6 characters.',
      'Ensure the confirmation password exactly matches the new password.',
      'If you have completely forgotten your current password, contact your workspace Administrator to reset it.',
    ],
  },
  {
    id: 'calendar_meeting_error',
    category: 'Meetings & Schedule',
    title: 'Cannot Schedule Meeting or Missing Fields',
    severity: 'warning',
    cause:
      'One or more required fields are missing: Meeting Title, Date, Start Time, or Attendee selection.',
    steps: [
      'Check that all required fields are filled: Meeting Title, Date, Start Time.',
      'Select at least one attendee from the employee list.',
      'If including a video call link (Google Meet, Zoom, Microsoft Teams), ensure it begins with https://.',
      'Confirm the selected meeting time does not conflict with existing scheduled events.',
    ],
    targetTab: 'calendar',
    actionLabel: 'Open Calendar Page',
  },
];

const COMMON_CHIPS = [
  { label: '🔒 10 PM Cutoff & Updates Locked', query: 'Why are my updates locked after 10 PM?' },
  { label: '🚫 Cannot Access Project / 403', query: 'Getting 403 forbidden or cannot access project' },
  { label: '🔑 Session Expired / 401', query: 'Session expired 401 unauthorized login error' },
  { label: '📎 Attachment Upload Failed', query: 'Task attachment failed to upload or file too large' },
  { label: '🏖️ Leave Balance / Request Error', query: 'Leave request denied or insufficient leave balance' },
  { label: '🔄 Network Error / 500', query: 'Failed to fetch network error or 500 internal server error' },
  { label: '👥 Morning Update Already Submitted', query: 'Morning update already submitted for today' },
  { label: '🔐 Password Change Failed', query: 'Cannot change password or old password incorrect' },
];

export const ErrorTroubleshooterBot: React.FC<ErrorTroubleshooterBotProps> = ({
  onNavigateTab,
  initialQuery,
}) => {
  const { currentUser } = useApp();
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'greeting',
      sender: 'bot',
      text: `Hello ${currentUser?.fullName || 'there'}! 👋 I am your Sierra Diagnostic Bot. If you are experiencing any error, lock issue, or permission roadblock, describe the problem below or pick a common topic to get an instant step-by-step resolution.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showMailModal, setShowMailModal] = useState(false);
  const [modalDetails, setModalDetails] = useState<{ topic: string; query: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialQuery) {
      handleUserSubmit(initialQuery);
    }
  }, [initialQuery]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const diagnoseQuery = (query: string): TroubleshootSolution => {
    const q = query.toLowerCase();

    // Check specific error patterns
    if (q.includes('lock') || q.includes('cutoff') || q.includes('10 pm') || q.includes('10pm') || q.includes('after 10') || q.includes('missed deadline') || q.includes('scan')) {
      return KNOWLEDGE_BASE[0]; // cutoff_10pm
    }
    if (q.includes('403') || q.includes('forbidden') || q.includes('permission') || q.includes('access denied') || q.includes('not assigned') || q.includes('join project') || q.includes('request project')) {
      return KNOWLEDGE_BASE[1]; // project_access_403
    }
    if (q.includes('401') || q.includes('unauthorized') || q.includes('session') || q.includes('token') || q.includes('logged out') || q.includes('invalid credentials') || q.includes('jwt')) {
      return KNOWLEDGE_BASE[2]; // auth_session_401
    }
    if (q.includes('upload') || q.includes('attachment') || q.includes('file') || q.includes('size') || q.includes('screenshot') || q.includes('proof')) {
      return KNOWLEDGE_BASE[3]; // attachment_upload_failed
    }
    if (q.includes('leave') || q.includes('balance') || q.includes('wfh') || q.includes('wfbo') || q.includes('vacation') || q.includes('sick')) {
      return KNOWLEDGE_BASE[4]; // leave_balance_error
    }
    if (q.includes('network') || q.includes('failed to fetch') || q.includes('500') || q.includes('502') || q.includes('503') || q.includes('cors') || q.includes('server error') || q.includes('connect')) {
      return KNOWLEDGE_BASE[5]; // network_500_fetch
    }
    if (q.includes('morning') && (q.includes('duplicate') || q.includes('already') || q.includes('submitted') || q.includes('twice'))) {
      return KNOWLEDGE_BASE[6]; // duplicate_morning_update
    }
    if (q.includes('evening') && (q.includes('early') || q.includes('before 4') || q.includes('window'))) {
      return KNOWLEDGE_BASE[7]; // evening_update_early
    }
    if (q.includes('password') || q.includes('passcode') || q.includes('reset password')) {
      return KNOWLEDGE_BASE[8]; // password_change_error
    }
    if (q.includes('meeting') || q.includes('calendar') || q.includes('schedule') || q.includes('holiday')) {
      return KNOWLEDGE_BASE[9]; // calendar_meeting_error
    }

    // Dynamic fallback diagnosis based on general keywords or error codes
    let dynamicTitle = 'Application Diagnostic Analysis';
    let dynamicCategory = 'General Issue';
    const dynamicSteps: string[] = [
      'Check if the action you are attempting requires specific role permissions (e.g. Admin or Project Lead).',
      'Verify that all mandatory form fields are completed with valid formats.',
      'Perform a browser cache hard-refresh (Ctrl+F5 or Cmd+Shift+R).',
      'Try signing out and signing back in to renew your authentication credentials.',
    ];

    if (/\b404\b/.test(q)) {
      dynamicTitle = '404 Resource Not Found';
      dynamicCategory = 'Routing / Data';
      dynamicSteps.unshift('The requested project, task, or user record may have been deleted or archived by an administrator.');
    } else if (/\b422\b/.test(q) || q.includes('validation')) {
      dynamicTitle = '422 Validation Error';
      dynamicCategory = 'Input Validation';
      dynamicSteps.unshift('One of the input fields does not match expected criteria (e.g. invalid date range, negative hours, or missing required field).');
    }

    return {
      id: 'dynamic_diagnosis',
      category: dynamicCategory,
      title: dynamicTitle,
      severity: 'warning',
      cause: `The system detected a query regarding: "${query}". Here is how to diagnose and address it:`,
      steps: dynamicSteps,
      preventativeTip:
        'If this issue prevents you from completing your daily report or tasks, escalate immediately to eswar@sierraedge.ai.',
    };
  };

  const handleUserSubmit = (queryText: string) => {
    const trimmed = queryText.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const solution = diagnoseQuery(trimmed);
      const botMsg: Message = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: `Here is the diagnosis and step-by-step resolution for your issue:`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        troubleshootData: solution,
        solvedState: 'unanswered',
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 450);
  };

  const handleResolutionFeedback = (messageId: string, isSolved: boolean) => {
    setMessages(prev =>
      prev.map(msg => {
        if (msg.id === messageId) {
          return {
            ...msg,
            solvedState: isSolved ? 'solved' : 'unsolved',
            showEscalation: !isSolved,
          };
        }
        return msg;
      })
    );

    if (isSolved) {
      const botResponse: Message = {
        id: `bot-thankyou-${Date.now()}`,
        sender: 'bot',
        text: `🎉 Great! I'm glad that resolved your issue. Let me know if you run into any other questions or need assistance!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, botResponse]);
    } else {
      const botEscalation: Message = {
        id: `bot-escalate-${Date.now()}`,
        sender: 'bot',
        text: `I'm sorry those steps didn't solve your issue. Let's get our team to help you directly! You can email eswar@sierraedge.ai using the button below with all diagnostic details pre-filled.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        showEscalation: true,
      };
      setMessages(prev => [...prev, botEscalation]);
    }
  };

  const constructSupportEmail = (topic: string, query: string) => {
    const subject = `[Sierra Team Hub Support] Issue: ${topic || 'Assistance Needed'} - ${currentUser?.fullName || 'User'}`;
    const body = `Hello Eswar,

I encountered an error/issue on Sierra Team Hub that could not be resolved by the Diagnostic Bot.

=== User Information ===
Name: ${currentUser?.fullName || 'N/A'}
Email: ${currentUser?.email || 'N/A'}
Role: ${currentUser?.role || 'N/A'}
Department: ${currentUser?.department || 'N/A'}
Designation: ${currentUser?.designation || 'N/A'}

=== Issue Information ===
Topic: ${topic}
Query / Error: "${query}"
Time: ${new Date().toLocaleString()}
URL: ${window.location.href}
Browser: ${navigator.userAgent}

=== Description of What Happened ===
[Please describe what you were doing when the issue occurred]

Thank you,
${currentUser?.fullName || 'User'}`;

    return { subject, body };
  };

  const handleMailTo = (topic: string, query: string) => {
    const { subject, body } = constructSupportEmail(topic, query);
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
  };

  const handleCopyDraft = (topic: string, query: string, msgId: string) => {
    const { subject, body } = constructSupportEmail(topic, query);
    const fullDraft = `To: ${SUPPORT_EMAIL}\nSubject: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(fullDraft);
    setCopiedId(msgId);
    setTimeout(() => setCopiedId(null), 3000);
  };

  const handleResetChat = () => {
    const greeting: Message = {
      id: `greeting-${Date.now()}`,
      sender: 'bot',
      text: `Chat reset. What issue or error can I help you resolve today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([greeting]);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[720px] max-w-5xl mx-auto">
      {/* Bot Header */}
      <div className="bg-slate-800/80 border-b border-slate-700/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center space-x-3.5">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
              <Bot className="w-6 h-6" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base">Sierra Diagnostic Bot</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                24/7 Automated Assistant
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Instant error troubleshooting &bull; Escalates to{' '}
              <strong className="text-blue-400">{SUPPORT_EMAIL}</strong> if unresolved
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleResetChat}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            title="Reset conversation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Suggested Quick Chips */}
      <div className="bg-slate-950/60 border-b border-slate-800/80 px-6 py-2.5 overflow-x-auto">
        <div className="flex items-center space-x-2 min-w-max">
          <span className="text-[11px] font-semibold text-slate-400 flex items-center space-x-1 shrink-0">
            <Sparkles className="w-3 h-3 text-purple-400" />
            <span>Common Issues:</span>
          </span>
          {COMMON_CHIPS.map((chip, i) => (
            <button
              key={i}
              onClick={() => handleUserSubmit(chip.query)}
              className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-blue-600/20 text-slate-300 hover:text-blue-300 border border-slate-700/60 hover:border-blue-500/30 transition shrink-0"
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map(msg => {
          const isUser = msg.sender === 'user';
          const solution = msg.troubleshootData;

          return (
            <div
              key={msg.id}
              className={`flex items-start space-x-3 ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                  isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-purple-600/30 text-purple-300 border border-purple-500/30'
                }`}
              >
                {isUser ? (currentUser?.fullName?.charAt(0) || 'U') : <Bot className="w-4 h-4" />}
              </div>

              {/* Message Content */}
              <div className={`space-y-3 max-w-2xl ${isUser ? 'items-end' : 'items-start'}`}>
                {/* Text Bubble */}
                <div
                  className={`p-4 rounded-2xl text-xs leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md rounded-tr-none'
                      : 'bg-slate-800/90 text-slate-200 border border-slate-700/70 shadow-lg rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1.5 ${
                      isUser ? 'text-blue-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* Structured Solution Card if present */}
                {solution && (
                  <div className="bg-slate-800/95 border border-slate-700 rounded-2xl p-5 shadow-xl space-y-4 text-xs">
                    {/* Solution Header */}
                    <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded-full">
                          {solution.category}
                        </span>
                        <h4 className="font-bold text-white text-sm">{solution.title}</h4>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                        Diagnostics Ready
                      </span>
                    </div>

                    {/* Root Cause */}
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-300 space-y-1">
                      <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                        Root Cause
                      </div>
                      <p className="leading-relaxed">{solution.cause}</p>
                    </div>

                    {/* Step-by-Step Resolution */}
                    <div className="space-y-2">
                      <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Step-by-Step How to Solve</span>
                      </div>
                      <ol className="space-y-2">
                        {solution.steps.map((st, sIdx) => (
                          <li
                            key={sIdx}
                            className="flex items-start space-x-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800"
                          >
                            <span className="w-5 h-5 rounded-full bg-blue-500/20 text-blue-400 font-bold flex items-center justify-center shrink-0 text-[10px] mt-0.5">
                              {sIdx + 1}
                            </span>
                            <span className="text-slate-300 leading-relaxed">{st}</span>
                          </li>
                        ))}
                      </ol>
                    </div>

                    {/* Preventative Tip */}
                    {solution.preventativeTip && (
                      <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 flex items-start space-x-2">
                        <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-semibold">Best Practice: </strong>
                          {solution.preventativeTip}
                        </div>
                      </div>
                    )}

                    {/* Quick Action Button if targetTab */}
                    {solution.targetTab && onNavigateTab && (
                      <button
                        onClick={() => onNavigateTab(solution.targetTab!)}
                        className="w-full flex items-center justify-center space-x-2 py-2 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold transition"
                      >
                        <span>{solution.actionLabel || 'Navigate to Feature'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}

                    {/* Resolution Feedback Prompt */}
                    <div className="pt-2 border-t border-slate-700/80">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/80 p-3.5 rounded-xl border border-slate-800">
                        <span className="text-xs font-medium text-slate-300">
                          Did this solve your error?
                        </span>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleResolutionFeedback(msg.id, true)}
                            disabled={msg.solvedState === 'solved'}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              msg.solvedState === 'solved'
                                ? 'bg-emerald-500 text-white'
                                : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Yes, Solved!</span>
                          </button>

                          <button
                            onClick={() => handleResolutionFeedback(msg.id, false)}
                            disabled={msg.solvedState === 'unsolved'}
                            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                              msg.solvedState === 'unsolved'
                                ? 'bg-rose-500 text-white'
                                : 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>No, Not Solved</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Escalation Card: "Mail to eswar@sierraedge.ai" */}
                {msg.showEscalation && (
                  <div className="bg-gradient-to-br from-rose-950/40 via-slate-900 to-indigo-950/40 border border-rose-500/30 rounded-2xl p-5 shadow-2xl space-y-4 text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                        <Mail className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          Issue Not Solved? Mail Direct Support
                        </h4>
                        <p className="text-slate-400 text-xs">
                          Escalate directly to our technical lead for priority help
                        </p>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-300 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400 font-medium">Direct Support Email:</span>
                        <strong className="text-emerald-400 font-mono text-xs">
                          {SUPPORT_EMAIL}
                        </strong>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Click below to open your email client with full diagnostics pre-filled
                        (account details, error context, timestamps), or copy the draft directly.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        onClick={() =>
                          handleMailTo(
                            solution?.title || 'Unresolved Error',
                            msg.text || 'Assistance requested'
                          )
                        }
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-semibold shadow-lg shadow-rose-600/20 transition"
                      >
                        <Mail className="w-4 h-4" />
                        <span>Mail to eswar@sierraedge.ai</span>
                      </button>

                      <button
                        onClick={() =>
                          handleCopyDraft(
                            solution?.title || 'Unresolved Error',
                            msg.text || 'Assistance requested',
                            msg.id
                          )
                        }
                        className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-400" />
                            <span className="text-emerald-400">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            <span>Copy Draft</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          setModalDetails({
                            topic: solution?.title || 'Unresolved Error',
                            query: msg.text || 'Assistance requested',
                          });
                          setShowMailModal(true);
                        }}
                        className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition"
                        title="View Full Email Composer"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isTyping && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/30 flex items-center justify-center text-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-slate-800/90 border border-slate-700/70 p-3.5 rounded-2xl rounded-tl-none flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="bg-slate-800/80 border-t border-slate-700/80 p-4">
        <form
          onSubmit={e => {
            e.preventDefault();
            handleUserSubmit(inputText);
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Type or paste your error message (e.g. '10 PM lock', '403 forbidden', 'cannot upload')..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
          />

          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="flex items-center space-x-1.5 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-blue-500/20"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Diagnose</span>
          </button>
        </form>

        <div className="flex items-center justify-between mt-2.5 text-[11px] text-slate-400 px-1">
          <span>
            💡 Powered by Sierra Error Diagnostic Engine &bull; Over 10+ error rules
          </span>
          <span>
            If unresolved: <strong className="text-rose-400">{SUPPORT_EMAIL}</strong>
          </span>
        </div>
      </div>

      {/* Full Support Email Composer Modal */}
      {showMailModal && modalDetails && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2.5">
                <Mail className="w-5 h-5 text-rose-400" />
                <h3 className="font-bold text-white text-sm">Escalate to Support</h3>
              </div>
              <button
                onClick={() => setShowMailModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 font-semibold mb-1">To</label>
                <input
                  type="text"
                  readOnly
                  value={SUPPORT_EMAIL}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-emerald-400 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Subject</label>
                <input
                  type="text"
                  readOnly
                  value={constructSupportEmail(modalDetails.topic, modalDetails.query).subject}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-semibold mb-1">Body Preview</label>
                <textarea
                  readOnly
                  rows={9}
                  value={constructSupportEmail(modalDetails.topic, modalDetails.query).body}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-slate-300 font-mono text-[11px] leading-relaxed resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowMailModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                Close
              </button>

              <button
                onClick={() => {
                  handleCopyDraft(modalDetails.topic, modalDetails.query, 'modal');
                }}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
              >
                {copiedId === 'modal' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Draft</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  handleMailTo(modalDetails.topic, modalDetails.query);
                  setShowMailModal(false);
                }}
                className="flex items-center space-x-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white text-xs font-semibold transition"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Open in Mail Client</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
