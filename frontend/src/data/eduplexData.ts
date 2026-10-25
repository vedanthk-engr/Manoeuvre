export interface Course {
  id: string;
  title: string;
  lessons: number;
  rating: number;
  category: string;
  type: string;
  instructor?: string;
  remaining?: string;
  progress?: number;
  iconType: 'writing' | 'testing' | 'photo' | '3d' | 'dev';
  color: string;
  bgColor: string;
}

export interface ScheduleItem {
  id: string;
  title: string;
  subtitle: string;
  time: string;
  type: 'Lecture - Class' | 'Group - Test' | 'Lecture - Test' | 'Workshop';
  iconType: 'grid' | 'pin' | 'flower' | 'palette';
  color: string;
  bgColor: string;
  room?: string;
}

export interface Assignment {
  id: string;
  title: string;
  due: string;
  status: 'In progress' | 'Completed' | 'Upcoming';
  iconType: 'dots' | 'donut' | 'diamond';
  color: string;
  bgColor: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'assignment' | 'course' | 'system' | 'mention';
}

export const initialNewCourses: Course[] = [
  {
    id: 'course-1',
    title: 'Content Writing',
    lessons: 12,
    rating: 4.8,
    category: 'Research',
    type: 'Data Research',
    iconType: 'writing',
    color: '#ea580c',
    bgColor: '#fff3eb',
  },
  {
    id: 'course-2',
    title: 'Usability Testing',
    lessons: 15,
    rating: 5.0,
    category: 'Design',
    type: 'UI/UX Design',
    iconType: 'testing',
    color: '#84cc16',
    bgColor: '#f4fce3',
  },
  {
    id: 'course-3',
    title: 'Photography',
    lessons: 8,
    rating: 4.6,
    category: 'Art',
    type: 'Art and Design',
    iconType: 'photo',
    color: '#8b5cf6',
    bgColor: '#f3f0ff',
  },
];

export const initialActiveCourses: Course[] = [
  {
    id: 'taking-1',
    title: '3D Design Course',
    lessons: 24,
    rating: 4.9,
    category: '3D Art',
    type: 'Blender & Cinema4D',
    instructor: 'Micheal Andrew',
    remaining: '8h 45 min',
    progress: 45,
    iconType: '3d',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
  },
  {
    id: 'taking-2',
    title: 'Development Basics',
    lessons: 30,
    rating: 4.95,
    category: 'Programming',
    type: 'Frontend & Cloud',
    instructor: 'Natalia Vaman',
    remaining: '18h 12 min',
    progress: 75,
    iconType: 'dev',
    color: '#f43f5e',
    bgColor: '#ffe4e6',
  },
];

export const initialSchedule: ScheduleItem[] = [
  {
    id: 'sch-1',
    title: 'Design System',
    subtitle: 'Lecture - Class',
    time: '09:00 AM - 10:30 AM',
    type: 'Lecture - Class',
    iconType: 'grid',
    color: '#ea580c',
    bgColor: '#ffedd5',
    room: 'Hall A • Virtual Stream',
  },
  {
    id: 'sch-2',
    title: 'Typography',
    subtitle: 'Group - Test',
    time: '11:15 AM - 12:45 PM',
    type: 'Group - Test',
    iconType: 'pin',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    room: 'Studio Lab 3',
  },
  {
    id: 'sch-3',
    title: 'Color Style',
    subtitle: 'Group - Test',
    time: '02:00 PM - 03:30 PM',
    type: 'Group - Test',
    iconType: 'flower',
    color: '#65a30d',
    bgColor: '#ecfccb',
    room: 'Design Wing B',
  },
  {
    id: 'sch-4',
    title: 'Visual Design',
    subtitle: 'Lecture - Test',
    time: '04:00 PM - 05:30 PM',
    type: 'Lecture - Test',
    iconType: 'palette',
    color: '#d97706',
    bgColor: '#fef3c7',
    room: 'Main Amphitheater',
  },
];

export const initialAssignments: Assignment[] = [
  {
    id: 'asg-1',
    title: 'Methods of data',
    due: '02 July, 10:30 AM',
    status: 'In progress',
    iconType: 'dots',
    color: '#7c3aed',
    bgColor: '#ede9fe',
  },
  {
    id: 'asg-2',
    title: 'Market Research',
    due: '14 June, 12:45 AM',
    status: 'Completed',
    iconType: 'donut',
    color: '#16a34a',
    bgColor: '#dcfce7',
  },
  {
    id: 'asg-3',
    title: 'Data Collection',
    due: '12 May, 11:00 AM',
    status: 'Upcoming',
    iconType: 'diamond',
    color: '#ea580c',
    bgColor: '#ffedd5',
  },
];

export const initialNotifications: NotificationItem[] = [
  {
    id: 'notif-1',
    title: 'New assignment graded',
    message: 'Your submission for Usability Testing Lab #4 received 98/100.',
    time: '15 mins ago',
    read: false,
    type: 'assignment',
  },
  {
    id: 'notif-2',
    title: 'Live lecture starting',
    message: 'Micheal Andrew started 3D Design Course Live Q&A session.',
    time: '1 hour ago',
    read: false,
    type: 'course',
  },
  {
    id: 'notif-3',
    title: 'Manoeuvre Glove Synced',
    message: 'Wearable gesture controller connected via Wi-Fi telemetry.',
    time: '3 hours ago',
    read: true,
    type: 'system',
  },
];

export const activityData = {
  Weekly: [
    { day: 'Su', hours: 0.8, fullDate: '1 Jan 2023', durationStr: '48 min' },
    { day: 'Mo', hours: 4.8, fullDate: '2 Jan 2023', durationStr: '04:48 hr' },
    { day: 'Tu', hours: 3.5, fullDate: '3 Jan 2023', durationStr: '03:30 hr' },
    { day: 'We', hours: 1.8, fullDate: '4 Jan 2023', durationStr: '01:48 hr' },
    { day: 'Th', hours: 6.2, fullDate: '5 Jan 2023', durationStr: '01:45 min', active: true },
    { day: 'Fr', hours: 1.2, fullDate: '6 Jan 2023', durationStr: '01:12 hr' },
    { day: 'Sa', hours: 4.6, fullDate: '7 Jan 2023', durationStr: '04:36 hr' },
  ],
  Monthly: [
    { day: 'W1', hours: 18.5, fullDate: 'Week 1', durationStr: '18:30 hr' },
    { day: 'W2', hours: 24.2, fullDate: 'Week 2', durationStr: '24:12 hr' },
    { day: 'W3', hours: 21.0, fullDate: 'Week 3', durationStr: '21:00 hr' },
    { day: 'W4', hours: 28.5, fullDate: 'Week 4', durationStr: '28:30 hr', active: true },
  ],
  Daily: [
    { day: '8AM', hours: 1.0, fullDate: 'Morning Session', durationStr: '01:00 hr' },
    { day: '11AM', hours: 2.5, fullDate: 'Midday Lecture', durationStr: '02:30 hr' },
    { day: '2PM', hours: 3.0, fullDate: 'Afternoon Lab', durationStr: '03:00 hr', active: true },
    { day: '5PM', hours: 1.5, fullDate: 'Evening Review', durationStr: '01:30 hr' },
    { day: '8PM', hours: 0.5, fullDate: 'Night Practice', durationStr: '00:30 hr' },
  ]
};
