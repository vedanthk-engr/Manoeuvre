export interface ManoeuvreCard {
  id: string;
  title: string;
  subtitle: string;
  statPrimary: string;
  statSecondary: string;
  type: string;
  iconType: 'glove' | 'presentation' | 'ai' | 'session';
  color: string;
  bgColor: string;
}

export interface SlideTopicItem {
  id: string;
  title: string;
  subtitle: string;
  timeOrSlides: string;
  type: string;
  iconType: 'architecture' | 'imu' | 'annotation' | 'ai';
  color: string;
  bgColor: string;
  slideIndex: number;
}

export interface LectureItem {
  id: string;
  title: string;
  courseCode: string;
  instructor: string;
  remainingDuration: string;
  progressPercent: number;
  iconType: 'embedded' | 'hci';
  color: string;
  bgColor: string;
}

export interface AnnotationRecapItem {
  id: string;
  title: string;
  meta: string;
  status: 'Annotated' | 'Highlighted' | 'Generated';
  iconType: 'stroke' | 'ocr' | 'analogy';
  color: string;
  bgColor: string;
  slideIndex: number;
}

export const initialManoeuvreTopCards: ManoeuvreCard[] = [
  {
    id: 'card-device',
    title: 'Wearable Glove',
    subtitle: 'ESP8266 / ESP32 Controller',
    statPrimary: 'Active',
    statSecondary: 'CURSOR Mode',
    type: '6-Axis MPU6050',
    iconType: 'glove',
    color: '#ea580c',
    bgColor: '#fff3eb',
  },
  {
    id: 'card-presentation',
    title: 'Operating Systems',
    subtitle: 'Lecture 04: Process Scheduling',
    statPrimary: 'Slide 4 / 24',
    statSecondary: 'PDF Loaded',
    type: '24 Slides Total',
    iconType: 'presentation',
    color: '#65a30d',
    bgColor: '#f4fce3',
  },
  {
    id: 'card-ai',
    title: 'AI Teaching Copilot',
    subtitle: 'Multimodal Neural Engine',
    statPrimary: 'Ready',
    statSecondary: 'Voice & OCR',
    type: 'Instant Analogy',
    iconType: 'ai',
    color: '#8b5cf6',
    bgColor: '#f3f0ff',
  },
];

export const initialSlideTopics: SlideTopicItem[] = [
  {
    id: 'topic-1',
    title: 'Hardware & System Architecture',
    subtitle: 'Lecture • Slides 1 - 6',
    timeOrSlides: 'Slide 1 - 6',
    type: 'Core Concept',
    iconType: 'architecture',
    color: '#ea580c',
    bgColor: '#ffedd5',
    slideIndex: 1,
  },
  {
    id: 'topic-2',
    title: 'Wearable IMU Telemetry & Gyro',
    subtitle: 'Hardware Demo • Slides 7 - 12',
    timeOrSlides: 'Slide 7 - 12',
    type: 'Live Demo',
    iconType: 'imu',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
    slideIndex: 7,
  },
  {
    id: 'topic-3',
    title: 'Vector Annotation & Stroke Ink',
    subtitle: 'Hands-on Lab • Slides 13 - 18',
    timeOrSlides: 'Slide 13 - 18',
    type: 'Interactive',
    iconType: 'annotation',
    color: '#65a30d',
    bgColor: '#ecfccb',
    slideIndex: 13,
  },
  {
    id: 'topic-4',
    title: 'AI Voice Co-Teaching & Q&A',
    subtitle: 'Synthesis • Slides 19 - 24',
    timeOrSlides: 'Slide 19 - 24',
    type: 'AI Synthesis',
    iconType: 'ai',
    color: '#d97706',
    bgColor: '#fef3c7',
    slideIndex: 19,
  },
];

export const initialActiveLectures: LectureItem[] = [
  {
    id: 'lec-1',
    title: 'CS402: Embedded Systems & Wearables',
    courseCode: 'CS402',
    instructor: 'Prof. Taylor Jenkins',
    remainingDuration: '35m remaining',
    progressPercent: 65,
    iconType: 'embedded',
    color: '#8b5cf6',
    bgColor: '#ede9fe',
  },
  {
    id: 'lec-2',
    title: 'CS204: Human Computer Interaction',
    courseCode: 'CS204',
    instructor: 'Prof. Taylor Jenkins',
    remainingDuration: '15m remaining',
    progressPercent: 85,
    iconType: 'hci',
    color: '#f43f5e',
    bgColor: '#ffe4e6',
  },
];

export const initialAnnotationsRecaps: AnnotationRecapItem[] = [
  {
    id: 'rec-1',
    title: 'IMU Gyro Drift Vector Stroke',
    meta: 'Slide 4 • 10:30 AM',
    status: 'Annotated',
    iconType: 'stroke',
    color: '#7c3aed',
    bgColor: '#ede9fe',
    slideIndex: 4,
  },
  {
    id: 'rec-2',
    title: 'Memory Bus Architecture OCR',
    meta: 'Slide 8 • 11:15 AM',
    status: 'Highlighted',
    iconType: 'ocr',
    color: '#16a34a',
    bgColor: '#dcfce7',
    slideIndex: 8,
  },
  {
    id: 'rec-3',
    title: 'Thread Scheduling AI Analogy',
    meta: 'Slide 14 • 11:45 AM',
    status: 'Generated',
    iconType: 'analogy',
    color: '#ea580c',
    bgColor: '#ffedd5',
    slideIndex: 14,
  },
];

export const gestureActivityData = {
  Weekly: [
    { day: 'Su', hours: 12, fullDate: 'Sunday Prep', durationStr: '12 Gestures' },
    { day: 'Mo', hours: 48, fullDate: 'CS402 Lecture', durationStr: '48 Gestures' },
    { day: 'Tu', hours: 35, fullDate: 'Hardware Lab', durationStr: '35 Gestures' },
    { day: 'We', hours: 18, fullDate: 'Faculty Review', durationStr: '18 Gestures' },
    { day: 'Th', hours: 64, fullDate: 'CS204 Interactive', durationStr: '64 Gestures • Slide 4', active: true },
    { day: 'Fr', hours: 15, fullDate: 'Seminar Q&A', durationStr: '15 Gestures' },
    { day: 'Sa', hours: 42, fullDate: 'Annotation Lab', durationStr: '42 Gestures' },
  ],
  Session: [
    { day: 'S1', hours: 10, fullDate: 'Slide 1: Intro', durationStr: '10 Gestures' },
    { day: 'S2', hours: 25, fullDate: 'Slide 2: Arch', durationStr: '25 Gestures' },
    { day: 'S3', hours: 18, fullDate: 'Slide 3: Timing', durationStr: '18 Gestures' },
    { day: 'S4', hours: 55, fullDate: 'Slide 4: IMU Demo', durationStr: '55 Gestures', active: true },
    { day: 'S5', hours: 30, fullDate: 'Slide 5: Code', durationStr: '30 Gestures' },
  ],
  Daily: [
    { day: '9AM', hours: 20, fullDate: 'Morning Class', durationStr: '20 Gestures' },
    { day: '11AM', hours: 50, fullDate: 'HCI Lecture', durationStr: '50 Gestures' },
    { day: '2PM', hours: 60, fullDate: 'Wearable Lab', durationStr: '60 Gestures', active: true },
    { day: '4PM', hours: 30, fullDate: 'AI Office Hours', durationStr: '30 Gestures' },
    { day: '6PM', hours: 10, fullDate: 'Evening Recap', durationStr: '10 Gestures' },
  ]
};
