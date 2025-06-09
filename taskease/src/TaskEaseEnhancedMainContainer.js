import React, { useState, useRef } from "react";

// PUBLIC_INTERFACE
/**
 * The main TaskEase Enhanced Container.
 * Handles advanced UI/UX, responsive design, per-task timer logic, animations, and visual polish.
 */
const pastelGradients = [
  "linear-gradient(120deg, #f8fafc 0%, #a1c4fd 100%)",
  "linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)",
  "linear-gradient(120deg, #d4fc79 0%, #96e6a1 100%)",
  "linear-gradient(130deg, #fff1eb 0%, #ace0f9 100%)"
];
const accentColors = ["#55D6BE", "#FF857F", "#98A8F8", "#AABD8C", "#F7C873"];
const coral = "#FF857F";
const teal = "#55D6BE";

// Motivational tips
const tips = [
  "You don’t have to be perfect, just get started.",
  "Small steps forward beat standing still.",
  "Win the day, one task at a time!",
  "Celebrate tiny victories today.",
  "Progress, not perfection!",
  "Today's effort builds tomorrow's success!"
];

function getRandomTip() {
  return tips[Math.floor(Math.random() * tips.length)];
}

function getRandomGradient() {
  return pastelGradients[Math.floor(Math.random() * pastelGradients.length)];
}

// Default Pomodoro
const DEFAULT_TIMER_SECONDS = 25 * 60;

// Helper
function formatTime(sec) {
  const m = String(Math.floor(sec / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${m}:${s}`;
}

const initialTasks = [
  // Example tasks
  { id: 1, text: "Read project requirements", completed: false, timer: null },
  { id: 2, text: "Plan UI components", completed: false, timer: null },
  { id: 3, text: "Finish coding first draft", completed: false, timer: null }
];

export default function TaskEaseEnhancedMainContainer() {
  // --- State ---
  const [tasks, setTasks] = useState(initialTasks);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskTimer, setNewTaskTimer] = useState(DEFAULT_TIMER_SECONDS);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [editingTaskText, setEditingTaskText] = useState("");
  const [timerPopups, setTimerPopups] = useState({});
  const [timers, setTimers] = useState({}); // id: { secondsLeft, running }
  const [tip, setTip] = useState(getRandomTip());

  // Store interval ids
  const timerIntervals = useRef({});

  // --- Timer Logic ---
  const handleStartTimer = (taskId) => {
    setTimers((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        running: true,
      },
    }));
    // Start interval
    if (!timerIntervals.current[taskId]) {
      timerIntervals.current[taskId] = setInterval(() => {
        setTimers((prev) => {
          const secondsLeft = (prev[taskId]?.secondsLeft || DEFAULT_TIMER_SECONDS) - 1;
          if (secondsLeft <= 0) {
            clearInterval(timerIntervals.current[taskId]);
            timerIntervals.current[taskId] = null;
            // (Optional: Vibration/audio notification)
            // window.navigator.vibrate?.(200);
            // alert("Time's up!");
            return {
              ...prev,
              [taskId]: { ...prev[taskId], secondsLeft: 0, running: false }
            };
          }
          return {
            ...prev,
            [taskId]: { ...prev[taskId], secondsLeft, running: true }
          };
        });
      }, 1000);
    }
  };

  const handlePauseTimer = (taskId) => {
    clearInterval(timerIntervals.current[taskId]);
    timerIntervals.current[taskId] = null;
    setTimers((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        running: false,
      },
    }));
  };

  const handleResetTimer = (taskId, base = null) => {
    clearInterval(timerIntervals.current[taskId]);
    timerIntervals.current[taskId] = null;
    setTimers((prev) => ({
      ...prev,
      [taskId]: {
        secondsLeft: base !== null ? base : prev[taskId]?.baseSeconds || DEFAULT_TIMER_SECONDS,
        baseSeconds: base !== null ? base : prev[taskId]?.baseSeconds || DEFAULT_TIMER_SECONDS,
        running: false,
      },
    }));
  };

  // --- Task Manipulation Handlers ---
  const handleAddTask = () => {
    if (!newTaskText.trim()) return;
    const newId = tasks.length ? Math.max(...tasks.map((t) => t.id)) + 1 : 1;
    const timerVal = Number(newTaskTimer) || DEFAULT_TIMER_SECONDS;
    setTasks([
      ...tasks,
      {
        id: newId,
        text: newTaskText.trim(),
        completed: false,
        timer: timerVal
      }
    ]);
    setTimers((prev) => ({
      ...prev,
      [newId]: { secondsLeft: timerVal, running: false, baseSeconds: timerVal }
    }));
    setNewTaskText("");
    setNewTaskTimer(DEFAULT_TIMER_SECONDS);
  };

  const handleDeleteTask = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
    if (timerIntervals.current[id]) {
      clearInterval(timerIntervals.current[id]);
      timerIntervals.current[id] = null;
    }
    // Remove respective timer and popup
    setTimers((prev) => {
      const nxt = { ...prev };
      delete nxt[id];
      return nxt;
    });
    setTimerPopups((prev) => {
      const nxt = { ...prev };
      delete nxt[id];
      return nxt;
    });
  };

  const handleToggleComplete = (id) => {
    setTasks(tasks.map((t) => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  // Editing tasks (optional animation)
  const startEditTask = (task) => {
    setEditingTaskId(task.id);
    setEditingTaskText(task.text);
  };

  const submitEditTask = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, text: editingTaskText.trim() } : t)));
    setEditingTaskId(null);
    setEditingTaskText("");
  };

  // --- Timer popup per task
  const openTimerPopup = (id) => {
    setTimerPopups((prev) => ({ ...prev, [id]: true }));
    // If timer state uninitialized, initialize
    if (!timers[id]) {
      const found = tasks.find((t) => t.id === id);
      setTimers((prev) => ({
        ...prev,
        [id]: {
          secondsLeft: found?.timer || DEFAULT_TIMER_SECONDS,
          baseSeconds: found?.timer || DEFAULT_TIMER_SECONDS,
          running: false,
        }
      }));
    }
  };
  const closeTimerPopup = (id) => setTimerPopups((prev) => ({ ...prev, [id]: false }));

  // Progress bar computation: percent of tasks completed
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Responsive style helpers
  const getCardAccent = (i) => accentColors[i % accentColors.length];

  // Gradient BG style
  const gradient = getRandomGradient();

  // Timer presets for adding a task
  const timerPresets = [
    { label: "Pomodoro (25:00)", value: 25 * 60 },
    { label: "Short (5:00)", value: 5 * 60 },
    { label: "Long (50:00)", value: 50 * 60 }
  ];

  // --- Render ---
  return (
    <div style={{
      minHeight: "100vh",
      fontFamily: "'Inter','Roboto','Helvetica','Arial',sans-serif",
      background: gradient,
      position: "relative",
      overflowX: "hidden",
      transition: "background 600ms cubic-bezier(0.4,0,0.2,1)"
    }}>
      {/* Abstract shapes */}
      <AbstractShapes />
      {/* Header */}
      <header style={{
        position: "sticky",
        top: 0,
        background: "rgba(255,255,255,0.3)",
        backdropFilter: "blur(9px)",
        zIndex: 90,
        padding: "28px 0 18px 0",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 6px 24px 0 rgba(100,60,120,0.07)"
      }}>
        <h1 style={{
          margin: 0,
          fontSize: "2.7rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          color: "#2a254e",
          flexGrow: 1,
          textAlign: "center",
          lineHeight: 1.1,
          userSelect: "none",
          textShadow: "0 2px 18px #c3dafb55"
        }}>My Tasks</h1>
        {/* Floating Add Button */}
        <button
          aria-label="Add Task"
          onClick={handleAddTask}
          style={{
            position: "absolute",
            right: 36,
            top: "50%",
            transform: "translateY(-55%)",
            boxShadow: "0 4px 20px 0 rgba(75,190,180,0.18)",
            background: `linear-gradient(145deg,${teal},${coral})`,
            border: "none",
            borderRadius: "50%",
            width: 54,
            height: 54,
            color: "white",
            fontSize: 32,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            cursor: "pointer",
            transition: "box-shadow 250ms, transform 200ms",
            outline: "none",
            zIndex: 99
          }}
          className="floating-add-btn"
          onMouseDown={(e) => e.currentTarget.style.transform += " scale(0.96)"}
          onMouseUp={(e) => e.currentTarget.style.transform = "translateY(-55%)"}
        >
          +
        </button>
      </header>
      {/* Main content - tasks list & add area */}
      <main
        style={{
          maxWidth: 480,
          margin: "0 auto",
          position: "relative",
          zIndex: 12,
          padding: "40px 8px 18px 8px",
          minHeight: "67vh"
        }}
      >
        {/* Task cards */}
        <div style={{ marginBottom: 36 }}>
          {tasks.map((task, i) => (
            <AnimatedTaskCard
              key={task.id}
              index={i}
              accent={getCardAccent(i)}
              task={task}
              complete={task.completed}
              editing={editingTaskId === task.id}
              editingText={editingTaskText}
              onEditStart={() => startEditTask(task)}
              onEditChange={setEditingTaskText}
              onEditSubmit={() => submitEditTask(task.id)}
              onToggleComplete={() => handleToggleComplete(task.id)}
              onDelete={() => handleDeleteTask(task.id)}
              // Timer props
              timer={timers[task.id] || {
                secondsLeft: typeof task.timer === "number" ? task.timer : DEFAULT_TIMER_SECONDS,
                running: false,
                baseSeconds: typeof task.timer === "number" ? task.timer : DEFAULT_TIMER_SECONDS
              }}
              onOpenTimerPopup={() => openTimerPopup(task.id)}
              timerPopupOpen={!!timerPopups[task.id]}
              onStartTimer={() => handleStartTimer(task.id)}
              onPauseTimer={() => handlePauseTimer(task.id)}
              onResetTimer={() => handleResetTimer(task.id, timers[task.id]?.baseSeconds || task.timer || DEFAULT_TIMER_SECONDS)}
              onCloseTimerPopup={() => closeTimerPopup(task.id)}
            />
          ))}
          {tasks.length === 0 && (
            <div style={{
              padding: "32px 0",
              textAlign: "center",
              color: "#a4adc8",
              fontWeight: 500,
              fontSize: "1.2rem"
            }}>
              No tasks yet. Add a new task below!
            </div>
          )}
        </div>
        {/* Add task area */}
        <AddTaskArea
          value={newTaskText}
          onChange={setNewTaskText}
          timerPreset={newTaskTimer}
          setTimerPreset={setNewTaskTimer}
          onAdd={handleAddTask}
          timerPresets={timerPresets}
        />
      </main>
      {/* Footer - Progress and tips */}
      <footer style={{
        width: "100%",
        background: "rgba(255,255,255,0.45)",
        boxShadow: "0 -1px 20px #bfcfe033",
        position: "fixed",
        left: 0,
        bottom: 0,
        padding: "16px 0 12px 0",
        zIndex: 50,
        textAlign: "center"
      }}>
        {/* Tasks left and progress bar */}
        <div style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          marginBottom: 5
        }}>
          <span style={{
            color: "#57535f",
            fontWeight: 600,
            fontSize: "1.08rem",
            marginRight: 14,
            letterSpacing: "0.03em"
          }}>
            {totalTasks - completedTasks} left
          </span>
          <div style={{ flex: 1 }}>
            <ProgressBar percent={progressPercent} />
          </div>
        </div>
        {/* Motivational tip */}
        <div style={{
          color: "#484253",
          fontSize: "1.01rem",
          fontWeight: 500,
          opacity: 0.85,
          marginTop: 6
        }}>{tip}</div>
      </footer>
      {/* Inline CSS-in-JS for additional polish */}
      <style>
        {`
        @media (max-width: 580px) {
          h1 { font-size: 2.1rem !important; }
          main { padding: 30px 1vw 0 1vw !important; }
        }
        .floating-add-btn:active {
          filter: brightness(0.96);
        }
        .floating-add-btn:hover {
          box-shadow: 0 8px 34px 0 rgba(75,190,180,0.25);
          transform: translateY(-55%) scale(1.09) !important;
          outline: 2.3px solid #55D6BE22;
        }
        .animated-strike {
          transition: all 450ms cubic-bezier(.6,-0.45,.65,1.5);
          position: relative;
        }
        .animated-strike.checked span {
          color: #a5a5bc !important;
          text-decoration: line-through wavy ${coral} 2.5px;
          opacity: 0.62;
        }
        `}
      </style>
    </div>
  );
}

// --- Subcomponents ---

// Abstract decorative background shapes
function AbstractShapes() {
  return (
    <>
      {/* Blurred pastel blobs */}
      <div
        style={{
          position: "fixed",
          left: -70,
          top: -54,
          width: 220,
          height: 220,
          background: "radial-gradient(circle at 60% 40%, #92fdee88 0%, #45cfff09 100%)",
          opacity: 0.66,
          filter: "blur(36px)",
          borderRadius: "50%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          right: -80,
          top: 120,
          width: 170,
          height: 170,
          background: "radial-gradient(circle at 30% 45%, #ffd6c488 0%, #f39c9790 100%)",
          opacity: 0.60,
          filter: "blur(26px)",
          borderRadius: "50%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "fixed",
          left: "45vw",
          bottom: -70,
          width: 220,
          height: 220,
          background: "radial-gradient(circle at 60% 60%, #a093f699 0%, #aec4fd33 100%)",
          opacity: 0.33,
          filter: "blur(60px)",
          borderRadius: "50%",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />
    </>
  );
}

// Task Card with animation, timer popup, delete, edit
function AnimatedTaskCard({
  task,
  accent,
  index,
  complete,
  editing,
  editingText,
  onEditStart,
  onEditChange,
  onEditSubmit,
  onToggleComplete,
  onDelete,
  timer,
  onOpenTimerPopup,
  timerPopupOpen,
  onStartTimer,
  onPauseTimer,
  onResetTimer,
  onCloseTimerPopup
}) {
  // Animating add/removal: fade/slide, with delay -> use index
  return (
    <div
      style={{
        background: "#f7fafb",
        boxShadow:
          "0 6px 28px 0 rgba(88,128,220,0.07), 0 2px 5px 0 #d9faef30",
        borderRadius: 18,
        padding: "18px 18px 16px 14px",
        marginBottom: 18,
        display: "flex",
        alignItems: "center",
        gap: 14,
        transition: "transform 490ms cubic-bezier(.8,0,.3,1.5), box-shadow 300ms",
        transform: complete
          ? "translateY(7px) scale(0.995)"
          : "translateY(0) scale(1)",
        opacity: complete ? 0.70 : 1,
        borderLeft: `5.7px solid ${accent}`,
        animation: `fadeSlideIn 560ms cubic-bezier(.6,-0.15,.65,1.2)`,
        animationDelay: `${index * 100}ms`,
        animationFillMode: "backwards",
        position: "relative"
      }}
    >
      {/* Animated checkbox */}
      <label style={{ marginRight: 2, cursor: "pointer" }}>
        <input
          type="checkbox"
          checked={!!complete}
          onChange={onToggleComplete}
          style={{
            appearance: "none",
            width: 22,
            height: 22,
            borderRadius: "50%",
            background: "#fff",
            border: `2.7px solid ${accent}`,
            outline: "none",
            boxShadow: "0 3px 8px #00c9a41f",
            verticalAlign: "middle",
            transition: "all 260ms"
          }}
        />
        <span
          style={{
            position: "absolute",
            left: 11,
            top: 9,
            width: 22,
            height: 22,
            pointerEvents: "none"
          }}
        >
          {complete && (
            <svg
              width="22"
              height="22"
              style={{ display: "block" }}
              viewBox="0 0 22 22"
            >
              <polyline
                points="5,12 10,17 17,6"
                style={{
                  fill: "none",
                  stroke: accent,
                  strokeWidth: 2.9,
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  filter: "drop-shadow(0 1px 2px #55d6be30)"
                }}
              />
            </svg>
          )}
        </span>
      </label>
      {/* Task text (or edit field) */}
      <div
        className={"animated-strike" + (complete ? " checked" : "")}
        style={{
          fontSize: "1.14rem",
          fontWeight: 510,
          flex: 1,
          userSelect: "text"
        }}
        onDoubleClick={onEditStart}
      >
        {editing ? (
          <input
            value={editingText}
            onChange={e => onEditChange(e.target.value)}
            onBlur={onEditSubmit}
            onKeyDown={e => {
              if (e.key === "Enter") onEditSubmit();
              if (e.key === "Escape") onEditSubmit();
            }}
            style={{
              width: "92%",
              fontSize: "1.1rem",
              padding: "6px 6px 6px 9px",
              borderRadius: 8,
              border: "1.3px solid #bbb",
              outline: "none",
              marginRight: 8
            }}
            autoFocus
          />
        ) : (
          <span style={{cursor: "text"}}>
            {task.text}
          </span>
        )}
      </div>
      {/* Timer icon and popup */}
      <div
        style={{ position: "relative", marginRight: 9 }}
        onClick={onOpenTimerPopup}
        tabIndex={0}
        aria-label="Set & view timer"
        role="button"
      >
        {/* Timer SVG */}
        <svg width={26} height={26} style={{cursor: "pointer"}} viewBox="0 0 26 26">
          <circle cx={13} cy={13} r={10.5} fill="#fff" stroke="#a7dde8" strokeWidth={1.7} />
          <ellipse cx={13} cy={13} rx={9} ry={9} fill="#fff" opacity={0.92} />
          <path
            d="M13 13V8.1"
            stroke="#65c1ea"
            strokeWidth="2.3"
            strokeLinecap="round"
          />
          <circle cx={13} cy={13} r={6.2}
            fill="none"
            stroke="#47b8d4"
            strokeWidth={timer?.running ? 2.5 : 1.3}
            style={{
              filter: timer?.running ? "drop-shadow(0 0 7px #37d9cc33)" : "none",
              transition: "stroke-width 300ms"
            }}
          />
        </svg>
        {/* Timer value, inline */}
        <div style={{
          position: "absolute",
          left: "52%",
          top: "13%",
          fontSize: "0.94rem",
          color: timer?.running ? "#00ad98" : "#5e659d",
          fontFamily: "monospace",
          fontWeight: 600,
          letterSpacing: "1px",
          pointerEvents: "none"
        }}>
          {formatTime(timer?.secondsLeft ?? DEFAULT_TIMER_SECONDS)}
        </div>
        {/* Popup UI */}
        {timerPopupOpen && (
          <TaskTimerPopup
            timer={timer}
            onStart={onStartTimer}
            onPause={onPauseTimer}
            onReset={onResetTimer}
            onClose={onCloseTimerPopup}
          />
        )}
      </div>
      {/* Delete/trash icon */}
      <button
        aria-label="Delete Task"
        onClick={onDelete}
        tabIndex={0}
        style={{
          border: "none",
          background: "none",
          marginLeft: 2,
          cursor: "pointer",
          outline: "none",
          padding: 4,
          borderRadius: "50%",
          transition: "background 150ms",
        }}
        onMouseEnter={e => e.currentTarget.style.background = "#ffe5e7"}
        onMouseLeave={e => e.currentTarget.style.background = "none"}
      >
        <svg width={23} height={23} viewBox="0 0 23 23">
          <rect x={6} y={8} width={2.2} height={8.4} rx={1} fill={coral} opacity={0.92} />
          <rect x={10.4} y={8} width={2.2} height={8.4} rx={1} fill={coral} opacity={0.92} />
          <rect x={14.7} y={8} width={2.2} height={8.4} rx={1} fill={coral} opacity={0.92} />
          <rect x={5} y={5.5} width={13} height={2.4} rx={1.2} fill="#feeaea" />
          <rect x={8} y={2.5} width={7} height={2.8} rx={1.2} fill="#feeaea" />
        </svg>
      </button>
      {/* CSS animation keyframes */}
      <style>{`
      @keyframes fadeSlideIn {
        from {
          opacity: 0; 
          transform: translateY(16px) scale(0.85);
        }
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      `}</style>
    </div>
  );
}

// Per-task timer popup, inline with controls
function TaskTimerPopup({ timer, onStart, onPause, onReset, onClose }) {
  return (
    <div style={{
      position: "absolute",
      top: 38,
      left: "50%",
      transform: "translateX(-45%)",
      background: "linear-gradient(134deg, #def6ecbb 60%, #b9ecec99 100%)",
      boxShadow: "0 7px 30px 0 #b2ecd030",
      borderRadius: 15,
      padding: "18px 25px 13px 18px",
      zIndex: 22,
      minWidth: 175,
      textAlign: "center",
      animation: "fadePopup 290ms cubic-bezier(.48,1.44,.18,1.26)"
    }}>
      {/* Timer value large */}
      <div
        style={{
          fontWeight: 700,
          fontSize: "2rem",
          color: "#16bdab",
          fontFamily: "monospace",
          letterSpacing: "2px"
        }}
      >
        {formatTime(timer?.secondsLeft ?? DEFAULT_TIMER_SECONDS)}
      </div>
      <div style={{ margin: "6px 0 10px 0" }}>
        {timer?.running ? (
          <button
            onClick={onPause}
            aria-label="Pause"
            style={{
              background: "#ffd6d4",
              color: "#de4f62",
              border: "none",
              borderRadius: 8,
              padding: "7px 18px",
              margin: "0 5px",
              fontWeight: 600,
              fontSize: "1.03rem",
              cursor: "pointer",
              outline: "none"
            }}
          >
            Pause
          </button>
        ) : (
          <button
            onClick={onStart}
            aria-label="Start"
            style={{
              background: "#caf6e2",
              color: "#1cab92",
              border: "none",
              borderRadius: 8,
              padding: "7px 16px",
              margin: "0 5px",
              fontWeight: 600,
              fontSize: "1.03rem",
              cursor: "pointer",
              outline: "none"
            }}
          >
            Start
          </button>
        )}
        <button
          onClick={onReset}
          aria-label="Reset"
          style={{
            background: "#e7eeff",
            color: "#5a6cd7",
            border: "none",
            borderRadius: 8,
            padding: "7px 12px",
            margin: "0 5px",
            fontWeight: 600,
            fontSize: "1.03rem",
            cursor: "pointer",
            outline: "none"
          }}
        >
          Reset
        </button>
      </div>
      {/* Popup Close */}
      <button
        onClick={onClose}
        aria-label="Close timer popup"
        style={{
          position: "absolute",
          right: 7,
          top: 6,
          background: "none",
          border: "none",
          fontSize: "1.1rem",
          color: "#a7adb9",
          cursor: "pointer",
          padding: 2,
        }}
      >×</button>
      <style>
        {`
        @keyframes fadePopup {
          from { opacity: 0; transform: scale(0.92) translateY(16px);}
          to { opacity: 1; transform: scale(1) translateY(0);}
        }
        `}
      </style>
    </div>
  );
}

// Add task area (bottom of main) with input, timer preset, add button
function AddTaskArea({
  value,
  onChange,
  timerPreset,
  setTimerPreset,
  onAdd,
  timerPresets
}) {
  return (
    <div
      style={{
        boxShadow: "0 2px 16px #e1f5ff66, 0 1px 5px #97e8c720",
        background: "#fff",
        borderRadius: 14,
        padding: "11px 10px",
        display: "flex",
        alignItems: "center",
        gap: 7,
        margin: "0 -2px 15px -2px"
      }}
    >
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Add a new task..."
        style={{
          flex: 2,
          padding: "9px 10px 9px 13px",
          borderRadius: 7,
          border: "1.5px solid #c0d1e9",
          outline: "none",
          fontSize: "1.11rem",
          transition: "border 160ms",
          fontWeight: 500,
          marginRight: 4,
        }}
        onKeyDown={e => e.key === "Enter" && onAdd()}
        maxLength={68}
      />
      {/* Timer dropdown */}
      <select
        value={timerPreset}
        onChange={e => setTimerPreset(Number(e.target.value))}
        style={{
          border: "1.1px solid #aeded9",
          borderRadius: 6,
          padding: "5.5px 9px",
          fontSize: "0.97rem",
          color: "#169da8",
          background: "#ecfdfa",
          marginRight: 1,
          fontWeight: 500
        }}
        aria-label="Choose a timer preset"
      >
        {timerPresets.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
        <option value={15 * 60}>15:00</option>
        <option value={10 * 60}>10:00</option>
      </select>
      {/* Add button */}
      <button
        onClick={onAdd}
        aria-label="Add"
        style={{
          background: `linear-gradient(140deg,${teal},${coral})`,
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: 39,
          height: 39,
          fontSize: 21,
          fontWeight: 700,
          boxShadow: "0 3px 14px 0 #99e0f040",
          cursor: "pointer",
          transition: "box-shadow 180ms"
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = "0 7px 26px #99e0f070"}
        onMouseLeave={e => e.currentTarget.style.boxShadow = "0 3px 14px 0 #99e0f040"}
      >+</button>
    </div>
  );
}

// Progress bar component (footer)
function ProgressBar({ percent }) {
  const pct = typeof percent === "number" && percent >= 0 ? Math.min(percent, 100) : 0;
  return (
    <div style={{
      background: "#e8f3fc",
      borderRadius: 18,
      height: 13,
      width: 110,
      margin: "0 8px",
      overflow: "hidden",
      boxShadow: "0 1px 5px #d4f6e522"
    }}>
      <div style={{
        height: "100%",
        width: pct + "%",
        background: `linear-gradient(90deg, #92f8ee 10%, #39ded7 100%)`,
        borderRadius: "18px 0 0 18px",
        transition: "width 380ms cubic-bezier(.65,0,.2,1.35)"
      }} />
    </div>
  );
}
