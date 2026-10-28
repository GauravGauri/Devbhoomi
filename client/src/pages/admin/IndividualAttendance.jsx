import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Button } from '../../components/ui/Button';
import {
  Calendar,
  Clock,
  UserCheck,
  Search,
  Download,
  Printer,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  CheckCircle2,
  Coffee,
  Building,
  Briefcase,
  TrendingUp,
  BarChart3,
  List,
  CalendarDays,
  Plus,
  Eye,
  X,
  MapPin,
  ShieldCheck,
  User,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import api from '../../services/api';
import toast from 'react-hot-toast';

const IndividualAttendance = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Parse query params for initial employee selection or month
  const queryParams = new URLSearchParams(location.search);
  const initialEmployeeId = queryParams.get('employeeId') || '';
  const initialMonth = queryParams.get('month') || new Date().toISOString().slice(0, 7);

  // Core state
  const [employees, setEmployees] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(initialEmployeeId);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [attendanceData, setAttendanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(true);

  // Filters & Tabs
  const [activeTab, setActiveTab] = useState('timesheet'); // 'timesheet' | 'weekly' | 'calendar'
  const [statusFilter, setStatusFilter] = useState('All');
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('All');

  // Modals
  const [selectedBreakRecord, setSelectedBreakRecord] = useState(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualData, setManualData] = useState({
    date: new Date().toISOString().slice(0, 10),
    checkInTime: '09:30',
    checkOutTime: '18:30',
    totalBreakMinutes: 60,
    late: false,
    attendanceType: 'Present',
    remarks: 'Timesheet adjustment verified by Admin',
  });

  // 1. Fetch list of all employees for selector
  const fetchEmployeesList = async () => {
    setEmployeesLoading(true);
    try {
      const { data } = await api.get('/admin/employees');
      const list = data.data || [];
      setEmployees(list);

      // If no employee is selected yet, pick the first one
      if (!selectedEmployeeId && list.length > 0) {
        setSelectedEmployeeId(list[0]._id);
      }
    } catch (err) {
      toast.error('Failed to load employees list');
    } finally {
      setEmployeesLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeesList();
  }, []);

  // 2. Fetch specific employee's attendance details & weekly breakdown
  const fetchEmployeeAttendance = async () => {
    if (!selectedEmployeeId) return;

    setLoading(true);
    try {
      const { data } = await api.get(
        `/attendance/employee/${selectedEmployeeId}?month=${selectedMonth}`
      );
      setAttendanceData(data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load individual employee attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedEmployeeId) {
      fetchEmployeeAttendance();
      // Keep URL query in sync
      const params = new URLSearchParams();
      params.set('employeeId', selectedEmployeeId);
      params.set('month', selectedMonth);
      navigate(`?${params.toString()}`, { replace: true });
    }
  }, [selectedEmployeeId, selectedMonth]);

  // Handle Month Navigation
  const handlePrevMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month - 2, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const handleNextMonth = () => {
    const [year, month] = selectedMonth.split('-').map(Number);
    const date = new Date(year, month, 1);
    setSelectedMonth(date.toISOString().slice(0, 7));
  };

  const handleCurrentMonth = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
  };

  // Filtered employees for search dropdown
  const filteredEmployees = useMemo(() => {
    return employees.filter((emp) => {
      const matchesSearch =
        !employeeSearchTerm ||
        emp.name?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(employeeSearchTerm.toLowerCase()) ||
        emp.email?.toLowerCase().includes(employeeSearchTerm.toLowerCase());

      const matchesDept =
        departmentFilter === 'All' || emp.department?.name === departmentFilter;

      return matchesSearch && matchesDept;
    });
  }, [employees, employeeSearchTerm, departmentFilter]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set();
    employees.forEach((emp) => {
      if (emp.department?.name) set.add(emp.department.name);
    });
    return Array.from(set);
  }, [employees]);

  // Selected employee object
  const currentEmployee = attendanceData?.employee || employees.find((e) => e._id === selectedEmployeeId);

  // Filtered daily records for table
  const filteredRecords = useMemo(() => {
    if (!attendanceData?.records) return [];
    if (statusFilter === 'All') return attendanceData.records;
    if (statusFilter === 'Late') return attendanceData.records.filter((r) => r.late);
    if (statusFilter === 'On Time') return attendanceData.records.filter((r) => !r.late && r.attendanceType === 'Present');
    return attendanceData.records.filter((r) => r.attendanceType === statusFilter);
  }, [attendanceData, statusFilter]);

  // Recharts data for Weekly Hours Chart
  const weeklyChartData = useMemo(() => {
    if (!attendanceData?.weeklyBreakdown) return [];
    return attendanceData.weeklyBreakdown.map((w) => ({
      name: `Week ${w.weekNumber}`,
      label: w.label,
      workedHours: parseFloat(w.totalWorkHours) || 0,
      expectedHours: Math.round(w.expectedWorkMinutes / 60) || 0,
      breakHours: parseFloat(w.formattedBreakHours) || 0,
      daysPresent: w.daysPresent,
    }));
  }, [attendanceData]);

  // Calendar matrix generator
  const calendarDaysMatrix = useMemo(() => {
    if (!selectedMonth) return [];
    const [yearStr, monthStr] = selectedMonth.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10) - 1; // 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const recordsByDate = {};
    if (attendanceData?.records) {
      attendanceData.records.forEach((r) => {
        recordsByDate[r.date] = r;
      });
    }

    const leavesByDate = {};
    if (attendanceData?.leaves) {
      attendanceData.leaves.forEach((leave) => {
        // mark each day in leave range
        const start = new Date(leave.startDate);
        const end = new Date(leave.endDate);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          const key = d.toISOString().slice(0, 10);
          leavesByDate[key] = leave;
        }
      });
    }

    const days = [];
    for (let dayNum = 1; dayNum <= daysInMonth; dayNum++) {
      const dateObj = new Date(year, month, dayNum);
      const dateStr = dateObj.toISOString().slice(0, 10);
      const dayOfWeek = dateObj.getDay(); // 0 is Sunday
      const record = recordsByDate[dateStr];
      const leave = leavesByDate[dateStr];

      days.push({
        dayNum,
        dateStr,
        dayOfWeek,
        isSunday: dayOfWeek === 0,
        record,
        leave,
      });
    }
    return days;
  }, [selectedMonth, attendanceData]);

  // Export Individual Worker CSV
  const handleExportCSV = () => {
    if (!attendanceData || !attendanceData.records || attendanceData.records.length === 0) {
      toast.error('No attendance records available to export for this worker.');
      return;
    }

    const emp = attendanceData.employee;
    const summary = attendanceData.summary;

    const metadataRows = [
      ['DEV BHOOMI CAMPUS - INDIVIDUAL EMPLOYEE ATTENDANCE TIMESHEET'],
      ['Employee Name', emp?.name || 'Unknown'],
      ['Employee ID', emp?.employeeId || '-'],
      ['Department', emp?.department?.name || 'General'],
      ['Designation', emp?.designation || '-'],
      ['Shift Policy', emp?.shift?.name || 'Standard 8h Shift'],
      ['Month', attendanceData.month],
      ['Total Working Hours', summary?.formattedTotalWorkingHours || '0h 0m'],
      ['Total Break Deducted', summary?.formattedTotalBreakHours || '0h 0m'],
      ['Days Present', `${summary?.totalPresent || 0} / ${summary?.totalDaysInMonth || 0}`],
      ['Late Punches Count', `${summary?.totalLate || 0} (${summary?.totalLateMinutes || 0} mins penalty)`],
      [],
      ['WEEKLY HOURS SUMMARY'],
      ['Week', 'Date Range', 'Days Present', 'Net Worked Hours', 'Break Hours', 'Overtime/Deficit'],
      ...attendanceData.weeklyBreakdown.map((w) => [
        `Week ${w.weekNumber}`,
        `"${w.startDate} to ${w.endDate}"`,
        w.daysPresent,
        w.formattedWorkHours,
        w.formattedBreakHours,
        `${w.overtimeOrDeficitMinutes >= 0 ? '+' : ''}${Math.round(w.overtimeOrDeficitMinutes / 60)}h ${Math.abs(w.overtimeOrDeficitMinutes % 60)}m`,
      ]),
      [],
      ['DAILY ATTENDANCE LOG LEDGER'],
      [
        'Date',
        'Day',
        'Check In',
        'Check Out',
        'Break Deducted',
        'Net Working Hours',
        'Status',
        'Late Minutes',
        'Remarks',
      ],
    ];

    const recordsRows = attendanceData.records.map((r) => {
      const dateObj = new Date(r.date + 'T00:00:00');
      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
      return [
        r.date,
        dayName,
        r.checkIn ? new Date(r.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        r.checkOut ? new Date(r.checkOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-',
        r.totalBreakMinutes ? `${Math.floor(r.totalBreakMinutes / 60)}h ${r.totalBreakMinutes % 60}m` : '0m',
        r.workingHours ? `${Math.floor(r.workingHours / 60)}h ${r.workingHours % 60}m` : '0h 0m',
        r.late ? 'Late' : r.attendanceType,
        r.lateMinutes || 0,
        `"${(r.remarks || '').replace(/"/g, '""')}"`,
      ];
    });

    const fullRows = [...metadataRows, ...recordsRows];
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      fullRows.map((row) => row.map((cell) => `"${(cell ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const safeEmpName = (emp?.name || 'Worker').replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `${safeEmpName}_Attendance_${attendanceData.month}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported timesheet for ${emp?.name}`);
  };

  // Handle Manual Punch Submission for the selected worker
  const handleManualPunchSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEmployeeId || !manualData.date) {
      toast.error('Date is required');
      return;
    }

    try {
      const checkInISO = manualData.checkInTime ? `${manualData.date}T${manualData.checkInTime}:00` : null;
      const checkOutISO = manualData.checkOutTime ? `${manualData.date}T${manualData.checkOutTime}:00` : null;

      await api.post('/attendance/manual', {
        employeeId: selectedEmployeeId,
        date: manualData.date,
        checkIn: checkInISO,
        checkOut: checkOutISO,
        totalBreakMinutes: parseInt(manualData.totalBreakMinutes, 10) || 0,
        late: manualData.late,
        attendanceType: manualData.attendanceType,
        remarks: manualData.remarks,
      });

      toast.success('Attendance punch saved successfully');
      setShowManualModal(false);
      fetchEmployeeAttendance();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record attendance');
    }
  };

  const openManualModalForDate = (dateStr) => {
    setManualData({
      date: dateStr || new Date().toISOString().slice(0, 10),
      checkInTime: '09:30',
      checkOutTime: '18:30',
      totalBreakMinutes: 60,
      late: false,
      attendanceType: 'Present',
      remarks: 'Timesheet adjustment verified by Admin',
    });
    setShowManualModal(true);
  };

  const summary = attendanceData?.summary;
  const currentWeek = attendanceData?.currentWeek;

  // Expected monthly hours calculation (e.g., 22 working days * 8h = 176h)
  const shiftDailyHours = currentEmployee?.shift?.minimumWorkingHours
    ? currentEmployee.shift.minimumWorkingHours / 60
    : 8;
  const targetMonthlyHours = (attendanceData?.weeklyBreakdown?.reduce((acc, w) => acc + w.workingDaysCount, 0) || 22) * shiftDailyHours;
  const actualWorkedHoursFloat = summary ? parseFloat(summary.totalWorkingHours) || 0 : 0;
  const monthlyCompletionPct = targetMonthlyHours > 0 ? Math.min(100, Math.round((actualWorkedHoursFloat / targetMonthlyHours) * 100)) : 0;

  return (
    <AdminLayout>
      {/* Header bar */}
      <header className="min-h-16 py-3 px-4 sm:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border-b border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-1 rounded-md bg-indigo-50 text-indigo-600">
              <UserCheck className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-gray-900">Individual Employee Attendance</h2>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Full timesheet ledger, weekly & monthly working hours analytics, break deductions, and attendance audit
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchEmployeeAttendance}
            isLoading={loading}
            className="flex items-center text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => window.print()}
            className="hidden sm:flex items-center text-xs"
            title="Print timesheet summary"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" /> Print
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => openManualModalForDate('')}
            className="flex items-center text-xs"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" /> Record Punch
          </Button>

          <Button
            size="sm"
            onClick={handleExportCSV}
            className="flex items-center text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" /> Export Worker CSV
          </Button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Filter & Employee Selector Bar */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 p-4 sm:p-5 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Employee Selector dropdown & search */}
            <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 min-w-[260px]">
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
                  <User className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Select Employee / Worker *
                </label>
                <div className="relative">
                  <select
                    value={selectedEmployeeId}
                    onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    disabled={employeesLoading}
                    className="w-full border border-gray-300 rounded-xl px-3.5 py-2 text-sm bg-gray-50/60 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-900 transition-colors shadow-2xs"
                  >
                    {employeesLoading ? (
                      <option value="">Loading staff directory...</option>
                    ) : employees.length === 0 ? (
                      <option value="">No employees found</option>
                    ) : (
                      filteredEmployees.map((emp) => (
                        <option key={emp._id} value={emp._id}>
                          {emp.name} (ID: {emp.employeeId || '-'}) • {emp.department?.name || 'General'}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Department quick filter */}
              <div className="sm:w-48">
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
                  <Building className="w-3.5 h-3.5 mr-1 text-gray-500" /> Department
                </label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-gray-700 shadow-2xs"
                >
                  <option value="All">All Departments</option>
                  {departmentsList.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Month Navigator */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1 flex items-center">
                  <Calendar className="w-3.5 h-3.5 mr-1 text-indigo-600" /> Filter Month
                </label>
                <div className="flex items-center space-x-1.5 bg-gray-50 p-1 rounded-xl border border-gray-200">
                  <button
                    onClick={handlePrevMonth}
                    className="p-1.5 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 transition-colors"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="border-0 bg-transparent px-2 py-1 text-sm font-semibold text-gray-900 focus:outline-none cursor-pointer"
                  />

                  <button
                    onClick={handleNextMonth}
                    className="p-1.5 rounded-lg hover:bg-white text-gray-600 hover:text-gray-900 transition-colors"
                    title="Next Month"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleCurrentMonth}
                    className="ml-1 px-2.5 py-1 text-xs font-semibold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 rounded-lg transition-colors"
                  >
                    Current
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Employee Profile Card */}
          {currentEmployee && (
            <div className="pt-4 border-t border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gray-50/80 to-indigo-50/30 p-4 rounded-xl border border-gray-100">
              <div className="flex items-center space-x-3.5">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
                  {currentEmployee.name ? currentEmployee.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base font-bold text-gray-900">{currentEmployee.name}</h3>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                        currentEmployee.status === 'Active'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {currentEmployee.status || 'Active'}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mt-1">
                    <span className="font-mono text-gray-700 font-medium">
                      ID: {currentEmployee.employeeId || '-'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center text-gray-600">
                      <Briefcase className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      {currentEmployee.designation || 'Staff'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center text-gray-600">
                      <Building className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      {currentEmployee.department?.name || 'General Dept'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Shift info badge */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-gray-200 text-xs shadow-2xs">
                  <span className="text-gray-400 font-medium block text-[10px] uppercase tracking-wider">
                    Assigned Shift
                  </span>
                  <div className="font-semibold text-gray-800 flex items-center mt-0.5">
                    <Clock className="w-3.5 h-3.5 mr-1 text-indigo-600" />
                    {currentEmployee.shift?.name || 'Standard Day'} (
                    {currentEmployee.shift?.startTime || '09:30'} - {currentEmployee.shift?.endTime || '18:30'})
                  </div>
                </div>

                <div className="bg-white/80 backdrop-blur-xs px-3.5 py-2 rounded-lg border border-gray-200 text-xs shadow-2xs">
                  <span className="text-gray-400 font-medium block text-[10px] uppercase tracking-wider">
                    Contact
                  </span>
                  <span className="font-medium text-gray-700 block mt-0.5 truncate max-w-[180px]">
                    {currentEmployee.email || currentEmployee.phone || 'No email registered'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* METRICS SUMMARY GRID: Total Working Hours, Weekly Hours, Averages */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* Card 1: Monthly Total Working Hours */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between relative overflow-hidden">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Monthly Total Hours
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <p className="text-2xl sm:text-3xl font-extrabold text-indigo-700">
                    {summary ? summary.formattedTotalWorkingHours : '0h 0m'}
                  </p>
                  <span className="text-xs font-semibold text-gray-500">
                    ({summary?.totalWorkingHours || '0.0'} hrs)
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            {/* Target comparison progress */}
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-gray-500">Target: ~{targetMonthlyHours}h</span>
                <span className="font-bold text-indigo-700">{monthlyCompletionPct}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-indigo-600 h-1.5 rounded-full transition-all duration-500"
                  style={{ width: `${monthlyCompletionPct}%` }}
                />
              </div>
            </div>
          </div>

          {/* Card 2: Current Week Hours */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                  Current Week Hours
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <p className="text-2xl sm:text-3xl font-extrabold text-blue-800">
                    {currentWeek ? currentWeek.formattedWorkHours : '0h 0m'}
                  </p>
                  <span className="text-xs font-semibold text-gray-500">
                    ({currentWeek?.totalWorkHours || '0.0'} hrs)
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
              <span>{currentWeek?.daysPresent || 0} active days this week</span>
              <span className="font-semibold text-blue-700">Week in Progress</span>
            </div>
          </div>

          {/* Card 3: Days Present & Attendance Rate */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-green-600 uppercase tracking-wider">
                  Attendance & Present Days
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <p className="text-2xl sm:text-3xl font-extrabold text-green-800">
                    {summary ? summary.totalPresent : 0}
                  </p>
                  <span className="text-xs font-medium text-gray-500">
                    / {summary?.totalDaysInMonth || 30} days in month
                  </span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-500">
                Avg: <strong className="text-gray-800">{summary?.formattedAvgDailyHours || '0h 0m'}</strong>/day
              </span>
              {summary?.approvedLeavesCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold text-[11px]">
                  {summary.approvedLeavesCount} Approved Leave
                </span>
              )}
            </div>
          </div>

          {/* Card 4: Break Deductions & Late Punches */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
                  Breaks & Late Arrivals
                </span>
                <div className="flex items-baseline space-x-2 mt-1">
                  <p className="text-2xl sm:text-3xl font-extrabold text-amber-800">
                    {summary ? summary.formattedTotalBreakHours : '0h 0m'}
                  </p>
                  <span className="text-xs font-medium text-gray-500">deducted</span>
                </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                <Coffee className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
              <span className="text-gray-600 font-medium flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 mr-1 text-amber-500" />
                {summary?.totalLate || 0} Late Punches
              </span>
              <span className="text-red-600 font-semibold text-[11px]">
                {summary?.totalLateMinutes || 0}m delayed
              </span>
            </div>
          </div>
        </div>

        {/* TABS & MAIN CONTENT AREA */}
        <div className="bg-white rounded-2xl shadow-xs border border-gray-200 overflow-hidden">
          {/* Tabs bar */}
          <div className="px-4 sm:px-6 pt-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50/50">
            <div className="flex items-center space-x-2 sm:space-x-3 overflow-x-auto">
              <button
                onClick={() => setActiveTab('timesheet')}
                className={`pb-3 px-3 text-sm font-semibold flex items-center border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'timesheet'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4 mr-2" />
                Daily Timesheet ({filteredRecords.length})
              </button>

              <button
                onClick={() => setActiveTab('weekly')}
                className={`pb-3 px-3 text-sm font-semibold flex items-center border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'weekly'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 mr-2" />
                Weekly Hours Breakdown ({attendanceData?.weeklyBreakdown?.length || 0} Weeks)
              </button>

              <button
                onClick={() => setActiveTab('calendar')}
                className={`pb-3 px-3 text-sm font-semibold flex items-center border-b-2 transition-all whitespace-nowrap ${
                  activeTab === 'calendar'
                    ? 'border-indigo-600 text-indigo-700'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <CalendarDays className="w-4 h-4 mr-2" />
                Monthly Calendar Grid
              </button>
            </div>

            {/* Quick Status Filter if on timesheet tab */}
            {activeTab === 'timesheet' && (
              <div className="pb-3 flex items-center space-x-2">
                <span className="text-xs text-gray-500 font-semibold flex items-center">
                  <Filter className="w-3.5 h-3.5 mr-1" /> Filter Status:
                </span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border border-gray-300 rounded-lg px-2.5 py-1 text-xs bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="On Time">On Time</option>
                  <option value="Late">Late Arrivals</option>
                  <option value="Present">Present</option>
                  <option value="Half Day">Half Day</option>
                </select>
              </div>
            )}
          </div>

          {/* TAB 1: DAILY TIMESHEET LEDGER */}
          {activeTab === 'timesheet' && (
            <div className="overflow-x-auto min-h-[350px]">
              <table className="w-full min-w-[760px] divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Date & Day
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Check In
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Check Out
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Break Deducted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Net Work Hours
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                      Audit Remarks
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="text-center py-12 text-gray-500 text-sm">
                        <div className="inline-block animate-spin rounded-full h-6 w-6 border-2 border-indigo-600 border-t-transparent mr-2 align-middle" />
                        Loading employee timesheet...
                      </td>
                    </tr>
                  ) : filteredRecords.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-14 text-gray-500 text-sm">
                        <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                          <Clock className="w-6 h-6" />
                        </div>
                        <p className="font-semibold text-gray-700">No attendance records found</p>
                        <p className="text-xs text-gray-400 mt-1">
                          No punches match the active criteria for {selectedMonth}.
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openManualModalForDate('')}
                          className="mt-3 text-xs"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Record Manual Punch
                        </Button>
                      </td>
                    </tr>
                  ) : (
                    filteredRecords.map((record) => {
                      const dateObj = new Date(record.date + 'T00:00:00');
                      const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                      const isWeekend = dateObj.getDay() === 0 || dateObj.getDay() === 6;

                      return (
                        <tr
                          key={record._id}
                          className={`hover:bg-gray-50/80 transition-colors ${
                            isWeekend ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          {/* Date & Day */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-sm font-bold text-gray-900">
                                {record.date}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                                  isWeekend
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {dayName}
                              </span>
                            </div>
                          </td>

                          {/* Check In */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                            {record.checkIn ? (
                              <div className="flex items-center">
                                <span>
                                  {new Date(record.checkIn).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {record.checkInLocation && (
                                  <span
                                    title={`Verified at ${record.checkInLocation.distanceMeters}m from office premise`}
                                    className="ml-1.5 text-indigo-500 hover:text-indigo-700"
                                  >
                                    <MapPin className="w-3.5 h-3.5 inline" />
                                  </span>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>

                          {/* Check Out */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                            {record.checkOut ? (
                              <div className="flex items-center">
                                <span>
                                  {new Date(record.checkOut).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                                {record.checkOutLocation && (
                                  <span
                                    title={`Verified at ${record.checkOutLocation.distanceMeters}m from office premise`}
                                    className="ml-1.5 text-indigo-500 hover:text-indigo-700"
                                  >
                                    <MapPin className="w-3.5 h-3.5 inline" />
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-amber-600 font-medium text-xs">In Progress</span>
                            )}
                          </td>

                          {/* Break Deducted */}
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            {record.totalBreakMinutes > 0 ? (
                              <button
                                onClick={() => setSelectedBreakRecord(record)}
                                className="text-amber-700 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-md text-xs font-semibold flex items-center transition-colors"
                                title="Click to view break audit details"
                              >
                                <Coffee className="w-3 h-3 mr-1" />
                                {Math.floor(record.totalBreakMinutes / 60)}h{' '}
                                {record.totalBreakMinutes % 60}m
                              </button>
                            ) : (
                              <span className="text-gray-400 text-xs">0m</span>
                            )}
                          </td>

                          {/* Net Working Hours */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-extrabold text-indigo-900 bg-indigo-50/80 px-2.5 py-1 rounded-md">
                              {record.workingHours
                                ? `${Math.floor(record.workingHours / 60)}h ${record.workingHours % 60}m`
                                : '0h 0m'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {record.late ? (
                              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full bg-red-100 text-red-800">
                                Late ({record.lateMinutes}m)
                              </span>
                            ) : record.attendanceType === 'Half Day' ? (
                              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full bg-blue-100 text-blue-800">
                                Half Day
                              </span>
                            ) : (
                              <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-bold rounded-full bg-green-100 text-green-800">
                                {record.attendanceType || 'Present'}
                              </span>
                            )}
                          </td>

                          {/* Remarks */}
                          <td className="px-6 py-4 text-xs text-gray-500 max-w-xs truncate">
                            {record.remarks || '-'}
                          </td>

                          {/* Action */}
                          <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-medium">
                            <button
                              onClick={() => {
                                setManualData({
                                  date: record.date,
                                  checkInTime: record.checkIn
                                    ? new Date(record.checkIn).toTimeString().slice(0, 5)
                                    : '09:30',
                                  checkOutTime: record.checkOut
                                    ? new Date(record.checkOut).toTimeString().slice(0, 5)
                                    : '18:30',
                                  totalBreakMinutes: record.totalBreakMinutes || 0,
                                  late: record.late || false,
                                  attendanceType: record.attendanceType || 'Present',
                                  remarks: record.remarks || '',
                                });
                                setShowManualModal(true);
                              }}
                              className="text-indigo-600 hover:text-indigo-900 font-semibold p-1 hover:bg-indigo-50 rounded-md transition-colors"
                            >
                              Edit Punch
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: WEEKLY BREAKDOWN */}
          {activeTab === 'weekly' && (
            <div className="p-4 sm:p-6 space-y-6">
              {/* Visual Bar Chart comparing Worked Hours vs Expected Target */}
              <div className="bg-gray-50/60 rounded-xl p-4 border border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">
                      Weekly Working Hours Trend vs Target
                    </h4>
                    <p className="text-xs text-gray-500">
                      Visual comparison of net hours worked per week against target shift workload
                    </p>
                  </div>
                  <div className="flex items-center space-x-3 text-xs">
                    <span className="flex items-center">
                      <span className="w-3 h-3 rounded-xs bg-indigo-600 mr-1.5" /> Worked Hours
                    </span>
                    <span className="flex items-center text-gray-600">
                      <span className="w-3 h-3 rounded-xs bg-gray-300 mr-1.5" /> Target Hours
                    </span>
                  </div>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6B7280" />
                      <YAxis tick={{ fontSize: 12 }} stroke="#6B7280" unit="h" />
                      <Tooltip
                        formatter={(val, name) => [`${val} hrs`, name === 'workedHours' ? 'Worked Hours' : 'Target Hours']}
                        contentStyle={{ backgroundColor: '#1F2937', color: '#fff', borderRadius: '8px', border: 'none' }}
                      />
                      <Bar dataKey="workedHours" fill="#4F46E5" radius={[4, 4, 0, 0]} name="workedHours" />
                      <Bar dataKey="expectedHours" fill="#CBD5E1" radius={[4, 4, 0, 0]} name="expectedHours" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Weekly Cards & Ledger */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {attendanceData?.weeklyBreakdown?.map((week) => {
                  const isPositive = week.overtimeOrDeficitMinutes >= 0;
                  const diffHours = (Math.abs(week.overtimeOrDeficitMinutes) / 60).toFixed(1);

                  return (
                    <div
                      key={week.weekNumber}
                      className="bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 text-xs font-bold">
                            Week {week.weekNumber}
                          </span>
                          <span className="text-xs font-mono text-gray-500 font-medium">
                            {week.startDate} to {week.endDate}
                          </span>
                        </div>

                        <div className="flex items-baseline space-x-2 mt-3">
                          <span className="text-2xl font-extrabold text-gray-900">
                            {week.formattedWorkHours}
                          </span>
                          <span className="text-xs text-gray-500">
                            / {week.formattedExpectedHours} target
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-gray-100 text-xs">
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">
                              Days Present
                            </span>
                            <span className="font-semibold text-gray-800 mt-0.5 block">
                              {week.daysPresent} / {week.workingDaysCount} days
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">
                              Break Deducted
                            </span>
                            <span className="font-semibold text-amber-700 mt-0.5 block">
                              {week.formattedBreakHours}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">
                              Late Punches
                            </span>
                            <span className="font-semibold text-red-600 mt-0.5 block">
                              {week.daysLate} {week.daysLate === 1 ? 'day' : 'days'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400 block text-[10px] uppercase font-bold">
                              Punctuality Rate
                            </span>
                            <span className="font-semibold text-green-700 mt-0.5 block">
                              {week.attendanceRate}%
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs">
                        <span className="text-gray-500">Workload Variance:</span>
                        <span
                          className={`font-bold flex items-center ${
                            isPositive ? 'text-green-700' : 'text-amber-700'
                          }`}
                        >
                          {isPositive ? (
                            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                          ) : (
                            <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                          )}
                          {isPositive ? `+${diffHours}h surplus` : `-${diffHours}h deficit`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: MONTHLY CALENDAR GRID */}
          {activeTab === 'calendar' && (
            <div className="p-4 sm:p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <div>
                  <h4 className="text-sm font-bold text-gray-900">
                    Monthly Attendance Matrix ({selectedMonth})
                  </h4>
                  <p className="text-xs text-gray-500">
                    Day-by-day attendance status, logged daily hours, and leave moderation mapping
                  </p>
                </div>
                {/* Legend */}
                <div className="flex items-center flex-wrap gap-3 text-xs">
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-green-500 mr-1.5" /> Present / On Time
                  </span>
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-amber-500 mr-1.5" /> Late Punch
                  </span>
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-blue-500 mr-1.5" /> Half Day
                  </span>
                  <span className="flex items-center">
                    <span className="w-3 h-3 rounded-full bg-purple-500 mr-1.5" /> Approved Leave
                  </span>
                  <span className="flex items-center text-gray-400">
                    <span className="w-3 h-3 rounded-full bg-gray-200 mr-1.5" /> Weekend / Off
                  </span>
                </div>
              </div>

              {/* Grid of days in the month */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                {calendarDaysMatrix.map((item) => {
                  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                  const dayName = dayNames[item.dayOfWeek];
                  const hasRecord = Boolean(item.record);
                  const isLate = item.record?.late;
                  const isHalfDay = item.record?.attendanceType === 'Half Day';
                  const isLeave = Boolean(item.leave);

                  let bgClass = 'bg-white border-gray-200 hover:border-gray-400';
                  let badge = null;

                  if (hasRecord) {
                    if (isLate) {
                      bgClass = 'bg-amber-50/70 border-amber-300';
                      badge = <span className="text-[10px] font-bold text-amber-700">Late ({item.record.lateMinutes}m)</span>;
                    } else if (isHalfDay) {
                      bgClass = 'bg-blue-50/70 border-blue-300';
                      badge = <span className="text-[10px] font-bold text-blue-700">Half Day</span>;
                    } else {
                      bgClass = 'bg-green-50/70 border-green-300';
                      badge = <span className="text-[10px] font-bold text-green-700">Present</span>;
                    }
                  } else if (isLeave) {
                    bgClass = 'bg-purple-50/70 border-purple-300';
                    badge = <span className="text-[10px] font-bold text-purple-700">{item.leave.leaveType}</span>;
                  } else if (item.isSunday) {
                    bgClass = 'bg-gray-50 border-gray-200 text-gray-400';
                    badge = <span className="text-[10px] text-gray-400 font-semibold">Sunday Off</span>;
                  }

                  const hoursWorked = item.record?.workingHours
                    ? `${Math.floor(item.record.workingHours / 60)}h ${item.record.workingHours % 60}m`
                    : null;

                  return (
                    <div
                      key={item.dayNum}
                      onClick={() => openManualModalForDate(item.dateStr)}
                      className={`rounded-xl border p-3 flex flex-col justify-between min-h-[100px] cursor-pointer transition-all hover:shadow-xs ${bgClass}`}
                      title={`Click to edit or record punch for ${item.dateStr}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-gray-900">{item.dayNum}</span>
                        <span className="text-[11px] font-semibold text-gray-500 uppercase">{dayName}</span>
                      </div>

                      <div className="my-2">
                        {badge}
                        {hoursWorked && (
                          <div className="text-xs font-mono font-bold text-gray-800 mt-1">
                            {hoursWorked}
                          </div>
                        )}
                      </div>

                      <div className="text-[10px] text-gray-400 flex items-center justify-between pt-1 border-t border-gray-100/60">
                        <span>{item.dateStr.slice(5)}</span>
                        <span className="text-indigo-600 font-medium">Edit</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MODAL 1: VIEW BREAK DEDUCTIONS AUDIT */}
      {selectedBreakRecord && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50 shrink-0">
              <div className="flex items-center space-x-2">
                <Coffee className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-gray-900">
                  Break Deductions: {selectedBreakRecord.date}
                </h3>
              </div>
              <button
                onClick={() => setSelectedBreakRecord(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/80 border border-amber-200">
                <div>
                  <span className="text-xs text-amber-800 font-semibold uppercase">Total Break Deducted</span>
                  <p className="text-xl font-extrabold text-amber-900">
                    {Math.floor(selectedBreakRecord.totalBreakMinutes / 60)}h{' '}
                    {selectedBreakRecord.totalBreakMinutes % 60}m
                  </p>
                </div>
                <div className="text-right text-xs text-amber-800">
                  <span>Deducted from gross duration</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Break Logs</h4>
                {selectedBreakRecord.breaks?.length === 0 ? (
                  <p className="text-xs text-gray-500 py-3 text-center">
                    No individual break timestamps logged. Break minutes were entered as aggregate deduction.
                  </p>
                ) : (
                  selectedBreakRecord.breaks?.map((b, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg border border-gray-200 bg-gray-50/50 flex flex-col space-y-1 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-gray-800">{b.breakType || 'General Break'}</span>
                        <span className="font-mono font-semibold text-amber-700">
                          {b.duration || 0} mins
                        </span>
                      </div>
                      <div className="text-gray-500 font-mono flex items-center justify-between">
                        <span>
                          Start: {b.startTime ? new Date(b.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                        <span>
                          End: {b.endTime ? new Date(b.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                      </div>
                      {b.isAutomatic && (
                        <span className="text-[10px] text-amber-600 font-semibold">
                          * Triggered automatically by office GPS boundary
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex justify-end shrink-0">
              <Button size="sm" variant="outline" onClick={() => setSelectedBreakRecord(null)}>
                Close
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: RECORD / EDIT MANUAL PUNCH */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-3 sm:p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden border border-gray-100">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gray-50/50 shrink-0">
              <h3 className="text-base font-bold text-gray-900">
                Adjust Timesheet Punch ({currentEmployee?.name})
              </h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleManualPunchSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Date *</label>
                <input
                  required
                  type="date"
                  value={manualData.date}
                  onChange={(e) => setManualData({ ...manualData, date: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Check In Time</label>
                  <input
                    type="time"
                    value={manualData.checkInTime}
                    onChange={(e) => setManualData({ ...manualData, checkInTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Check Out Time</label>
                  <input
                    type="time"
                    value={manualData.checkOutTime}
                    onChange={(e) => setManualData({ ...manualData, checkOutTime: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Lunch / Break Duration (Minutes deducted)
                </label>
                <input
                  type="number"
                  min="0"
                  value={manualData.totalBreakMinutes}
                  onChange={(e) => setManualData({ ...manualData, totalBreakMinutes: e.target.value })}
                  placeholder="e.g. 60"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
                <p className="text-[11px] text-gray-400 mt-0.5">
                  Deducted directly from gross hours to calculate net work hours.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Attendance Type</label>
                  <select
                    value={manualData.attendanceType}
                    onChange={(e) => setManualData({ ...manualData, attendanceType: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                  >
                    <option value="Present">Present</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Short Leave">Short Leave</option>
                  </select>
                </div>
                <div className="flex items-center pt-2 sm:pt-5">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={manualData.late}
                      onChange={(e) => setManualData({ ...manualData, late: e.target.checked })}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <span className="text-xs font-medium text-gray-700">Mark as Late Punch</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Audit Remarks</label>
                <input
                  value={manualData.remarks}
                  onChange={(e) => setManualData({ ...manualData, remarks: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g. On-site project duty / biometric override"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100">
                <Button variant="outline" type="button" onClick={() => setShowManualModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                  Save Punch
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default IndividualAttendance;
