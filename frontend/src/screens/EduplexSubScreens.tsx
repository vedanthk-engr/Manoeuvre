import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  Send,
  Bell,
  CheckCircle,
  Calendar,
  MessageSquare,
  Users,
  Settings,
  Plus,
  Play,
  Heart,
  MessageCircle,
  Sliders,
  Shield,
  Radio,
  Cpu,
  Video,
} from 'lucide-react';
import { Course, initialNewCourses, initialActiveCourses, NotificationItem, initialNotifications } from '../data/eduplexData';

/* =========================================================================
   MY COURSES SCREEN
   ========================================================================= */
export const EduplexCoursesScreen: React.FC<{
  onSelectCourse: (c: Course) => void;
  onOpenAddModal: () => void;
}> = ({ onSelectCourse, onOpenAddModal }) => {
  const [filterCat, setFilterCat] = useState('All');
  const [search, setSearch] = useState('');

  const allCourses: Course[] = [...initialActiveCourses, ...initialNewCourses];
  const categories = ['All', 'UI/UX Design', 'Programming', 'Art and Design', 'Research'];

  const filtered = allCourses.filter((c) => {
    const matchCat = filterCat === 'All' || c.type.includes(filterCat) || c.category.includes(filterCat);
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">My Courses & Library</h2>
          <p className="text-xs text-slate-500">Explore and continue your learning paths</p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search library..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 text-xs rounded-full bg-slate-100 focus:bg-white border border-transparent focus:border-slate-300 focus:outline-none"
            />
          </div>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 text-xs font-bold shadow-sm transition-transform hover:scale-105"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Course</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCat(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              filterCat === cat
                ? 'bg-slate-950 text-white'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Course Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((course) => (
          <div
            key={course.id}
            onClick={() => onSelectCourse(course)}
            className="bg-white rounded-2xl p-5 border border-slate-200/80 hover:shadow-xl hover:border-slate-300 transition-all cursor-pointer group flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#d8fa55]/30 text-slate-900">
                  {course.type}
                </span>
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                  ★ {course.rating.toFixed(1)}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1">
                {course.title}
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Instructor: {course.instructor || 'Eduplex Faculty'} • {course.lessons} Lessons
              </p>
            </div>

            <div>
              {course.progress !== undefined ? (
                <div className="space-y-1.5 mb-4">
                  <div className="flex justify-between text-xs font-semibold text-slate-700">
                    <span>Progress</span>
                    <span>{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ) : null}

              <button className="w-full py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Continue Learning</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   MY CLASSES SCREEN
   ========================================================================= */
export const EduplexClassesScreen: React.FC<{
  onLaunchStudio?: () => void;
}> = ({ onLaunchStudio }) => {
  const classes = [
    {
      id: 'c1',
      title: 'Design System & Token Architecture',
      instructor: 'Micheal Andrew',
      time: '09:00 AM - 10:30 AM',
      status: 'Live Now',
      room: 'Virtual Room #104',
      slidesCount: 38,
    },
    {
      id: 'c2',
      title: 'Typography & Layout Testing',
      instructor: 'Prof. Helen Ross',
      time: '11:15 AM - 12:45 PM',
      status: 'Upcoming',
      room: 'Design Studio B',
      slidesCount: 24,
    },
    {
      id: 'c3',
      title: 'Human Computer Interaction & Gestures',
      instructor: 'Dr. Taylor Jenkins',
      time: '02:00 PM - 03:30 PM',
      status: 'Upcoming',
      room: 'Hardware Lab 7',
      slidesCount: 42,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Live Classes & Classrooms</h2>
          <p className="text-xs text-slate-500">Interactive lectures, presentations and student workshops</p>
        </div>

        {onLaunchStudio && (
          <button
            onClick={onLaunchStudio}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md transition-all"
          >
            <Video className="w-4 h-4" />
            <span>Open Lecture Studio</span>
          </button>
        )}
      </div>

      <div className="space-y-3.5">
        {classes.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#ede9fe] text-[#7c3aed] flex items-center justify-center font-bold text-lg">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-slate-900">{c.title}</h3>
                  {c.status === 'Live Now' && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">
                      Live
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500">
                  {c.instructor} • {c.room} • {c.slidesCount} slides
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold text-slate-700">{c.time}</span>
              <button
                onClick={() => alert(`Connecting to ${c.title}...`)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  c.status === 'Live Now'
                    ? 'bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 shadow'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {c.status === 'Live Now' ? 'Join Stream' : 'View Syllabus'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   MESSAGES SCREEN
   ========================================================================= */
export const EduplexMessagesScreen: React.FC = () => {
  const [messages, setMessages] = useState([
    { id: '1', sender: 'Micheal Andrew', text: 'Hey Taylor! Have you checked the 3D Design course assignment?', time: '10:14 AM', isMe: false },
    { id: '2', sender: 'Taylor', text: 'Yes Micheal, I just finished the lighting and render passes!', time: '10:16 AM', isMe: true },
    { id: '3', sender: 'Micheal Andrew', text: 'Awesome work. Bring your slides to today\'s lecture review.', time: '10:18 AM', isMe: false },
  ]);
  const [inputMsg, setInputMsg] = useState('');

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    setMessages((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        sender: 'Taylor',
        text: inputMsg,
        time: 'Just now',
        isMe: true,
      },
    ]);
    setInputMsg('');
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[520px] bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
      {/* Sidebar Channels */}
      <div className="p-4 border-r border-slate-100 flex flex-col">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Direct Messages</h3>
        <div className="space-y-1.5 flex-1 overflow-y-auto">
          {[
            { name: 'Micheal Andrew', role: '3D Instructor', active: true, unread: 0 },
            { name: 'Natalia Vaman', role: 'Frontend Lead', active: false, unread: 1 },
            { name: 'Study Group: HCI Labs', role: '4 Members', active: false, unread: 3 },
            { name: 'Manoeuvre AI Copilot', role: 'Lecture Assistant', active: false, unread: 0 },
          ].map((ch, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                ch.active ? 'bg-slate-100 font-semibold text-slate-900' : 'hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div>
                <p className="text-xs font-bold">{ch.name}</p>
                <p className="text-[10px] text-slate-400">{ch.role}</p>
              </div>
              {ch.unread > 0 && (
                <span className="w-5 h-5 rounded-full bg-[#ff7243] text-white text-[10px] font-bold flex items-center justify-center">
                  {ch.unread}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="col-span-2 flex flex-col justify-between p-4 bg-slate-50/50">
        {/* Chat Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200/60">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-slate-900">Micheal Andrew</span>
          </div>
          <span className="text-[11px] text-slate-400">Online • 3D Design Faculty</span>
        </div>

        {/* Message Log */}
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.isMe ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-xs sm:max-w-md px-4 py-2.5 rounded-2xl text-xs ${
                  m.isMe
                    ? 'bg-slate-900 text-white rounded-br-none'
                    : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'
                }`}
              >
                {m.text}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">{m.time}</span>
            </div>
          ))}
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex items-center gap-2 pt-2">
          <input
            type="text"
            value={inputMsg}
            onChange={(e) => setInputMsg(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 text-xs rounded-full bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#d8fa55]"
          />
          <button
            type="submit"
            className="w-8 h-8 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 flex items-center justify-center shadow transition-transform hover:scale-105"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};

/* =========================================================================
   NOTIFICATIONS SCREEN
   ========================================================================= */
export const EduplexNotificationsScreen: React.FC = () => {
  const [notifs, setNotifs] = useState<NotificationItem[]>(initialNotifications);

  const markAllRead = () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Notifications</h2>
          <p className="text-xs text-slate-500">Activity updates and wearable controller alerts</p>
        </div>

        <button
          onClick={markAllRead}
          className="text-xs font-bold text-indigo-600 hover:text-indigo-800"
        >
          Mark all as read
        </button>
      </div>

      <div className="space-y-2.5">
        {notifs.map((n) => (
          <div
            key={n.id}
            className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
              n.read ? 'bg-white border-slate-200/80 text-slate-600' : 'bg-indigo-50/40 border-indigo-100 text-slate-900'
            }`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  n.read ? 'bg-slate-100 text-slate-500' : 'bg-[#d8fa55] text-slate-950 font-bold'
                }`}
              >
                <Bell className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold">{n.title}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                <span className="text-[10px] text-slate-400 mt-1 block">{n.time}</span>
              </div>
            </div>

            {!n.read && (
              <span className="w-2 h-2 rounded-full bg-[#ff7243] flex-shrink-0 mt-2" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   COMMUNITY SCREEN
   ========================================================================= */
export const EduplexCommunityScreen: React.FC = () => {
  const [posts, setPosts] = useState([
    {
      id: 'p1',
      author: 'Sarah Chen',
      role: 'UI Designer',
      title: 'How do you handle color contrast tokens in dark vs light mode?',
      likes: 24,
      comments: 8,
      tags: ['Design System', 'Accessibility'],
      time: '2 hours ago',
    },
    {
      id: 'p2',
      author: 'Alex Rivera',
      role: 'Embedded Developer',
      title: 'Sharing my custom gesture mappings for the ESP32 Manoeuvre Glove!',
      likes: 42,
      comments: 15,
      tags: ['Wearables', 'Hardware', 'IMU'],
      time: '5 hours ago',
    },
  ]);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Eduplex Community</h2>
          <p className="text-xs text-slate-500">Peer discussions, showcase & collaborative workshops</p>
        </div>

        <button
          onClick={() => alert('Opening new discussion composer...')}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#d8fa55] hover:bg-[#cbf53d] text-slate-950 text-xs font-bold shadow"
        >
          <Plus className="w-4 h-4" />
          <span>New Discussion</span>
        </button>
      </div>

      <div className="space-y-4">
        {posts.map((post) => (
          <div
            key={post.id}
            className="bg-white rounded-2xl p-5 border border-slate-200 hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold">
                  {post.author[0]}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900">{post.author}</span>
                  <span className="text-[10px] text-slate-400 ml-2">{post.role} • {post.time}</span>
                </div>
              </div>
            </div>

            <h3 className="text-sm font-bold text-slate-900 mb-3">{post.title}</h3>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <div className="flex gap-1.5">
                {post.tags.map((t) => (
                  <span key={t} className="px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-semibold text-slate-600">
                    #{t}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-500">
                <button className="flex items-center gap-1 hover:text-rose-500 transition-colors">
                  <Heart className="w-3.5 h-3.5" />
                  <span>{post.likes}</span>
                </button>
                <button className="flex items-center gap-1 hover:text-indigo-600 transition-colors">
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>{post.comments}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* =========================================================================
   SETTINGS SCREEN
   ========================================================================= */
export const EduplexSettingsScreen: React.FC<{
  onLaunchHub: () => void;
}> = ({ onLaunchHub }) => {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Account & Hardware Settings</h2>
        <p className="text-xs text-slate-500">Configure profile, studio preferences, and controller sync</p>
      </div>

      <div className="bg-white rounded-3xl p-6 border border-slate-200 space-y-6 shadow-sm">
        {/* Profile Section */}
        <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
          <div className="w-14 h-14 rounded-2xl bg-[#e2d9fc] flex items-center justify-center font-bold text-indigo-700 text-xl border-2 border-white shadow">
            TJ
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Taylor Jenkins</h3>
            <p className="text-xs text-slate-500">taylor.jenkins@eduplex.studio • Senior Educator</p>
          </div>
        </div>

        {/* Hardware Wearable Settings */}
        <div className="pb-6 border-b border-slate-100">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <h4 className="text-sm font-bold text-slate-900">Manoeuvre Wearable Glove</h4>
            </div>
            <button
              onClick={onLaunchHub}
              className="text-xs font-bold text-slate-900 bg-[#d8fa55] px-3 py-1 rounded-full shadow-sm hover:bg-[#cbf53d]"
            >
              Open Controller Hub
            </button>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Calibrate 6-Axis IMU sensors, configure tactile button debounce times, and adjust gesture slide tilt thresholds.
          </p>
        </div>

        {/* Preferences */}
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-slate-900">Preferences</h4>
          {[
            { label: 'Receive assignment deadline reminders', def: true },
            { label: 'Auto-record live presentation audio and slide transitions', def: true },
            { label: 'Enable AI transcription and instant analogy generation', def: true },
          ].map((item, idx) => (
            <label key={idx} className="flex items-center justify-between cursor-pointer py-1">
              <span className="text-xs text-slate-700">{item.label}</span>
              <input type="checkbox" defaultChecked={item.def} className="w-4 h-4 accent-[#181a24] rounded" />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
