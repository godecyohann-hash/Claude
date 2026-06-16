import { useState } from "react";

const QUICK_TASKS = [
  { id: "croissant",        label: "Croissant",       emoji: "🥐" },
  { id: "almond_croissant", label: "Almond Croissant",emoji: "🥐" },
  { id: "ham_cheese",       label: "Ham & Cheese",    emoji: "🧀" },
  { id: "puff",             label: "Puff",            emoji: "🫓" },
  { id: "sweet_dough",      label: "Sweet Dough",     emoji: "🍞" },
  { id: "brioche",          label: "Brioche",         emoji: "🍞" },
  { id: "cannele",          label: "Cannelé",         emoji: "🍮" },
  { id: "madeleine",        label: "Madeleine",       emoji: "🍪" },
  { id: "bechamel",         label: "Béchamel",        emoji: "🥣" },
  { id: "custard",          label: "Custard",         emoji: "🍮" },
  { id: "almond_cream",     label: "Almond Cream",    emoji: "🥛" },
  { id: "jam",              label: "Jam",             emoji: "🍓" },
  { id: "syrup",            label: "Syrup",           emoji: "🍯" },
  { id: "egg_wash",         label: "Egg Wash",        emoji: "🥚" },
  { id: "onion",            label: "Onion",           emoji: "🧅" },
];

const ADMIN_PIN = "1234";

export default function App() {
  const [screen, setScreen] = useState("lock");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [adminEmail, setAdminEmail] = useState("");
  const [patissiers, setPatissiers] = useState(["Ziggy", "Jan"]);
  const [bakerEmails, setBakerEmails] = useState({ Ziggy: "", Jan: "" });
  const [newBakerName, setNewBakerName] = useState("");
  const [showAddBaker, setShowAddBaker] = useState(false);

  // Work list state
  const [pickedIds, setPickedIds] = useState(new Set());
  const [details, setDetails] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [customTasks, setCustomTasks] = useState([]);
  const [customInput, setCustomInput] = useState("");
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [selectedBakers, setSelectedBakers] = useState([]);
  const [sentLists, setSentLists] = useState([]);
  const [sentTo, setSentTo] = useState([]);

  // BAKE OFF state: { taskId: quantity string }
  const [bakeoffQty, setBakeoffQty] = useState({});
  const [bakeoffDate, setBakeoffDate] = useState(
    new Date().toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })
  );
  const [bakeoffSentLists, setBakeoffSentLists] = useState([]);

  // Baker view
  const [activeBaker, setActiveBaker] = useState(null);
  const [bakerTab, setBakerTab] = useState("tasks"); // "tasks" | "bakeoff"
  const [completions, setCompletions] = useState({});

  // PIN
  const handlePin = (digit) => {
    if (pinError) { setPin(""); setPinError(false); }
    const next = pin + digit;
    setPin(next);
    if (next.length === 4) {
      if (next === ADMIN_PIN) { setPin(""); setScreen("home"); }
      else { setPinError(true); setTimeout(() => { setPin(""); setPinError(false); }, 900); }
    }
  };

  // Work list helpers
  const allTasks = [...QUICK_TASKS, ...customTasks];
  const togglePick = (id) => setPickedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const updateDetail = (id, field, value) => setDetails(prev => ({ ...prev, [id]: { ...(prev[id] || {}), [field]: value } }));
  const getDetail = (id, field) => (details[id] || {})[field] || "";
  const pickedTasks = allTasks.filter(t => pickedIds.has(t.id));
  const canSend = pickedTasks.length > 0 && selectedBakers.length > 0;
  const addBaker = () => {
    const name = newBakerName.trim();
    if (!name || patissiers.includes(name)) return;
    setPatissiers(prev => [...prev, name]);
    setBakerEmails(prev => ({ ...prev, [name]: "" }));
    setNewBakerName("");
    setShowAddBaker(false);
  };
  const removeBaker = (name) => {
    setPatissiers(prev => prev.filter(p => p !== name));
    setBakerEmails(prev => { const n = { ...prev }; delete n[name]; return n; });
    setSelectedBakers(prev => prev.filter(p => p !== name));
  };
  const toggleBaker = (name) => setSelectedBakers(prev => prev.includes(name) ? prev.filter(p => p !== name) : [...prev, name]);

  const addCustomTask = () => {
    const label = customInput.trim();
    if (!label) return;
    const id = "custom_" + Date.now();
    setCustomTasks(prev => [...prev, { id, label, emoji: "📌", custom: true }]);
    setPickedIds(prev => { const n = new Set(prev); n.add(id); return n; });
    setCustomInput("");
    setShowCustomForm(false);
  };
  const removeCustomTask = (id) => {
    setCustomTasks(prev => prev.filter(t => t.id !== id));
    setPickedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
    setDetails(prev => { const d = { ...prev }; delete d[id]; return d; });
  };

  const handleSend = () => {
    const entry = {
      id: Date.now(),
      date: new Date().toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      bakers: [...selectedBakers],
      tasks: pickedTasks.map(t => ({
        id: t.id, label: t.label, emoji: t.emoji,
        quantity: getDetail(t.id, "quantity"),
        time: getDetail(t.id, "time"),
        notes: getDetail(t.id, "notes"),
      })),
    };
    setSentLists(prev => [entry, ...prev]);
    setSentTo([...selectedBakers]);
    setScreen("confirm");
  };

  const reset = () => {
    setPickedIds(new Set()); setDetails({}); setExpandedId(null);
    setSelectedBakers([]); setCustomTasks([]); setCustomInput(""); setShowCustomForm(false);
    setScreen("home");
  };

  // BAKE OFF helpers
  const bakeoffItems = allTasks.filter(t => bakeoffQty[t.id]);
  const bakeoffCount = bakeoffItems.length;
  const clearBakeoff = () => setBakeoffQty({});
  const saveBakeoffList = () => {
    if (bakeoffCount === 0) return;
    const entry = {
      id: Date.now(),
      date: bakeoffDate || new Date().toLocaleDateString("en-US", { weekday: "long", day: "2-digit", month: "long", year: "numeric" }),
      time: new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      items: allTasks.filter(t => bakeoffQty[t.id]).map(t => ({ ...t, qty: bakeoffQty[t.id] })),
    };
    setBakeoffSentLists(prev => [entry, ...prev]);
    clearBakeoff();
  };

  const buildBakeoffEmail = (list) => {
    let body = `AMANN PÂTISSERIE — BAKE OFF List\n`;
    body += `Date: ${list.date}\n\n`;
    list.items.forEach((t, i) => { body += `${i+1}. ${t.emoji} ${t.label}: ${t.qty}\n`; });
    body += `\n---\nAMANN PÂTISSERIE Admin App`;
    return body;
  };
  const emailBakeoff = (list) => {
    const to = Object.values(bakerEmails).filter(Boolean).join(",");
    const subject = encodeURIComponent(`AMANN PÂTISSERIE — BAKE OFF ${list.date}`);
    const body = encodeURIComponent(buildBakeoffEmail(list));
    const cc = adminEmail ? `&cc=${encodeURIComponent(adminEmail)}` : "";
    window.open(`mailto:${to}?subject=${subject}${cc}&body=${body}`);
  };

  // Baker / completions
  const toggleComplete = (listId, taskId) => setCompletions(prev => { const lc = prev[listId] || {}; return { ...prev, [listId]: { ...lc, [taskId]: !lc[taskId] } }; });
  const getProgress = (list) => { const comp = completions[list.id] || {}; const done = list.tasks.filter(t => comp[t.id]).length; return { done, total: list.tasks.length }; };
  const getBakerLists = (name) => sentLists.filter(l => l.bakers.includes(name));

  // Email report (work list)
  const buildEmailBody = (list) => {
    const comp = completions[list.id] || {};
    let body = `AMANN PÂTISSERIE — Work List Report\nDate: ${list.date} at ${list.time}\nAssigned to: ${list.bakers.join(", ")}\n\nTASKS:\n`;
    list.tasks.forEach((t, i) => {
      body += `\n${i+1}. [${comp[t.id] ? "✅ DONE" : "⬜ PENDING"}] ${t.label}\n`;
      if (t.quantity) body += `   Qty: ${t.quantity}\n`;
      if (t.time) body += `   Time: ${t.time}\n`;
      if (t.notes) body += `   Notes: ${t.notes}\n`;
    });
    const { done, total } = getProgress(list);
    body += `\nProgress: ${done}/${total} completed\n---\nAMANN PÂTISSERIE Admin App`;
    return body;
  };
  const sendReport = (list) => {
    const to = list.bakers.map(b => bakerEmails[b]).filter(Boolean).join(",");
    const subject = encodeURIComponent(`AMANN PÂTISSERIE — Work List ${list.date}`);
    const body = encodeURIComponent(buildEmailBody(list));
    const cc = adminEmail ? `&cc=${encodeURIComponent(adminEmail)}` : "";
    window.open(`mailto:${to}?subject=${subject}${cc}&body=${body}`);
  };

  const goBack = () => ({ adminPin:"lock", send:"create", report:"home", settings:"home", bakerView:"bakerSelect", bakerSelect:"lock", bakeoff:"home" }[screen] || "home");

  return (
    <div style={s.shell}>
      <div style={s.phone}>

        {/* STATUS BAR */}
        <div style={s.statusBar}>
          <span style={{ fontWeight:600 }}>{new Date().toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}</span>
          <span style={{ opacity:0.7 }}>▲ WiFi ●</span>
        </div>

        {/* ===== LOCK ===== */}
        {screen === "lock" && (
          <div style={s.lockPage}>
            <div style={{ fontSize:52, marginBottom:4 }}>🥐</div>
            <div style={s.lockTitle}>AMANN PÂTISSERIE</div>
            <div style={s.lockSub}>Who are you?</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, width:"100%", marginTop:8 }}>
              <button style={s.lockRoleBtn} onClick={() => setScreen("bakerSelect")}>
                <span style={{ fontSize:28 }}>👨‍🍳</span>
                <div><div style={{ fontWeight:700, fontSize:15 }}>I'm a Pastry Chef</div><div style={{ fontSize:11, opacity:0.7 }}>View & complete my tasks</div></div>
              </button>
              <button style={{ ...s.lockRoleBtn, background:"rgba(200,144,42,0.18)", borderColor:GOLD }} onClick={() => setScreen("adminPin")}>
                <span style={{ fontSize:28 }}>🔐</span>
                <div><div style={{ fontWeight:700, fontSize:15 }}>Admin</div><div style={{ fontSize:11, opacity:0.7 }}>Manage work lists & reports</div></div>
              </button>
            </div>
          </div>
        )}

        {/* ===== ADMIN PIN ===== */}
        {screen === "adminPin" && (
          <div style={s.lockPage}>
            <div style={{ fontSize:48, marginBottom:4 }}>🔐</div>
            <div style={s.lockTitle}>Admin Access</div>
            <div style={s.lockSub}>Enter your PIN</div>
            <div style={{ display:"flex", gap:16, margin:"16px 0 4px" }}>
              {[0,1,2,3].map(i => <div key={i} style={{ ...s.pinDot, ...(pin.length>i?s.pinDotFilled:{}), ...(pinError?s.pinDotError:{}) }} />)}
            </div>
            {pinError && <div style={{ color:"#E05555", fontSize:12, marginBottom:4 }}>Incorrect PIN</div>}
            <div style={s.pinGrid}>
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((d,i) => (
                <button key={i} style={{ ...s.pinBtn, ...(d===""?{background:"transparent",cursor:"default"}:{}) }}
                  onClick={() => { if(d==="⌫") setPin(p=>p.slice(0,-1)); else if(d) handlePin(d); }}>{d}</button>
              ))}
            </div>
            <button style={{ background:"none", border:"none", color:WARM, fontSize:12, marginTop:16, cursor:"pointer", opacity:0.6 }} onClick={() => { setPin(""); setScreen("lock"); }}>← Back</button>
            <div style={{ color:WARM, fontSize:11, opacity:0.4, marginTop:8 }}>Default PIN: 1234</div>
          </div>
        )}

        {/* ===== BAKER SELECT ===== */}
        {screen === "bakerSelect" && (
          <div style={s.lockPage}>
            <div style={{ fontSize:48, marginBottom:4 }}>👨‍🍳</div>
            <div style={s.lockTitle}>Who's working today?</div>
            <div style={s.lockSub}>Select your name</div>
            <div style={{ display:"flex", flexDirection:"column", gap:12, width:"100%", marginTop:16 }}>
              {patissiers.map(name => (
                <button key={name} style={s.bakerSelectBtn} onClick={() => { setActiveBaker(name); setScreen("bakerView"); }}>
                  <div style={s.bakerAvatarLg}>{name[0]}</div>
                  <span style={{ fontSize:18, fontWeight:700 }}>{name}</span>
                </button>
              ))}
            </div>
            <button style={{ background:"none", border:"none", color:WARM, fontSize:12, marginTop:24, cursor:"pointer", opacity:0.6 }} onClick={() => setScreen("lock")}>← Back</button>
          </div>
        )}

        {/* ===== BAKER VIEW ===== */}
        {screen === "bakerView" && activeBaker && (
          <>
            <div style={{ ...s.header, background:"#1A3A1A" }}>
              <button style={s.backBtn} onClick={() => setScreen("bakerSelect")}>←</button>
              <div style={{ flex:1 }}>
                <div style={s.headerTitle}>👨‍🍳 {activeBaker}</div>
              </div>
              <div style={{ ...s.avatar, background:"#2D6A2D", fontSize:14 }}>{activeBaker[0]}</div>
            </div>

            {/* Baker tab switcher */}
            <div style={s.bakerTabs}>
              <button style={{ ...s.bakerTab, ...(bakerTab==="tasks" ? s.bakerTabActive : {}) }} onClick={() => setBakerTab("tasks")}>
                📋 Work List
              </button>
              <button style={{ ...s.bakerTab, ...(bakerTab==="bakeoff" ? s.bakerTabActiveBakeoff : {}) }} onClick={() => setBakerTab("bakeoff")}>
                🏪 Bake Off
              </button>
            </div>

            <div style={s.scroll}>

              {/* WORK LIST TAB */}
              {bakerTab === "tasks" && (
                <>
                  {getBakerLists(activeBaker).length === 0 && (
                    <div style={s.emptyState}>
                      <div style={{ fontSize:48, marginBottom:12 }}>☕</div>
                      <div style={{ fontSize:15, color:BROWN, fontWeight:600, marginBottom:6 }}>No tasks yet.</div>
                      <div style={{ fontSize:13, color:GRAY }}>Check back after admin sends a work list.</div>
                    </div>
                  )}
                  {getBakerLists(activeBaker).map(list => {
                    const { done, total } = getProgress(list);
                    const pct = total>0 ? Math.round((done/total)*100) : 0;
                    const comp = completions[list.id] || {};
                    return (
                      <div key={list.id} style={s.bakerListCard}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                          <div><div style={{ fontSize:12, fontWeight:700, color:BROWN }}>{list.date}</div><div style={{ fontSize:11, color:GRAY }}>{list.time}</div></div>
                          <div style={{ textAlign:"right" }}>
                            <div style={{ fontSize:13, fontWeight:700, color:pct===100?"#2D6A2D":GOLD }}>{done}/{total} done</div>
                            {pct===100 && <div style={{ fontSize:10, color:"#2D6A2D", fontWeight:700 }}>✅ ALL COMPLETE</div>}
                          </div>
                        </div>
                        <div style={{ background:WARM, borderRadius:8, height:6, marginBottom:12, overflow:"hidden" }}>
                          <div style={{ background:pct===100?"#2D6A2D":GOLD, height:"100%", width:`${pct}%`, borderRadius:8, transition:"width 0.4s" }} />
                        </div>
                        {list.tasks.map(task => {
                          const isDone = !!comp[task.id];
                          return (
                            <div key={task.id} style={{ ...s.taskCheckRow, ...(isDone?s.taskCheckRowDone:{}) }} onClick={() => toggleComplete(list.id, task.id)}>
                              <div style={{ ...s.checkbox, ...(isDone?s.checkboxDone:{}) }}>{isDone && <span style={{ color:WHITE, fontSize:13, fontWeight:700 }}>✓</span>}</div>
                              <div style={{ flex:1 }}>
                                <div style={{ fontSize:15, fontWeight:600, color:isDone?GRAY:BROWN, textDecoration:isDone?"line-through":"none" }}>{task.emoji} {task.label}</div>
                                <div style={{ display:"flex", gap:8, marginTop:4, flexWrap:"wrap" }}>
                                  {task.quantity && <span style={s.taskMeta}>Qty: {task.quantity}</span>}
                                  {task.time && <span style={s.taskMeta}>⏰ {task.time}</span>}
                                </div>
                                {task.notes && <div style={s.taskNote}>📝 {task.notes}</div>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </>
              )}

              {/* BAKE OFF TAB — read-only */}
              {bakerTab === "bakeoff" && (
                <>
                  {bakeoffSentLists.length === 0 && (
                    <div style={s.emptyState}>
                      <div style={{ fontSize:48, marginBottom:12 }}>🏪</div>
                      <div style={{ fontSize:15, color:BROWN, fontWeight:600, marginBottom:6 }}>No Bake Off list yet.</div>
                      <div style={{ fontSize:13, color:GRAY }}>Admin will add quantities here.</div>
                    </div>
                  )}
                  {bakeoffSentLists.map(list => (
                    <div key={list.id} style={s.bakerListCard}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:12 }}>
                        <div style={{ fontSize:13, fontWeight:700, color:BROWN }}>📅 {list.date}</div>
                        <span style={{ ...s.historyBadge, background:"#FFF0D0", color:"#B05A00" }}>{list.items.length} items</span>
                      </div>
                      {list.items.map(t => (
                        <div key={t.id} style={s.bakeoffBakerRow}>
                          <span style={{ fontSize:20, width:30, textAlign:"center", flexShrink:0 }}>{t.emoji}</span>
                          <span style={{ flex:1, fontSize:14, fontWeight:600, color:BROWN }}>{t.label}</span>
                          <span style={s.bakeoffQtyBadge}>{t.qty}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </>
              )}

            </div>
          </>
        )}

        {/* ===== ADMIN SCREENS ===== */}
        {["home","create","send","confirm","report","settings","bakeoff"].includes(screen) && (
          <>
            <div style={s.header}>
              {screen !== "home" && <button style={s.backBtn} onClick={() => setScreen(goBack())}>←</button>}
              <div style={{ flex:1 }}>
                <div style={s.headerTitle}>
                  {screen==="home" && "🥐 AMANN PÂTISSERIE"}
                  {screen==="create" && "New Work List"}
                  {screen==="send" && "Send To"}
                  {screen==="confirm" && "Sent!"}
                  {screen==="report" && "Reports"}
                  {screen==="settings" && "Settings"}
                  {screen==="bakeoff" && "🏪 BAKE OFF"}
                </div>
                {screen==="home" && <div style={{ fontSize:11, color:WARM, opacity:0.85, marginTop:2 }}>Admin — Work List Management</div>}
                {screen==="bakeoff" && <div style={{ fontSize:11, color:"#FFD580", marginTop:2 }}>Quantities for the shop</div>}
              </div>
              {screen==="home" && (
                <div style={{ display:"flex", gap:8 }}>
                  <button style={s.iconBtn} onClick={() => setScreen("report")}>📧</button>
                  <button style={s.iconBtn} onClick={() => setScreen("settings")}>⚙️</button>
                  <button style={s.iconBtn} onClick={() => setScreen("lock")}>🔒</button>
                </div>
              )}
            </div>

            <div style={s.scroll}>

              {/* ===== HOME ===== */}
              {screen==="home" && (
                <div>
                  <button style={s.primaryBtn} onClick={() => { setPickedIds(new Set()); setDetails({}); setExpandedId(null); setSelectedBakers([]); setScreen("create"); }}>
                    + Create Work List
                  </button>
                  <div style={s.sectionLabel}>Sent History</div>
                  {sentLists.length===0 && (
                    <div style={s.emptyState}>
                      <div style={{ fontSize:48, marginBottom:12 }}>📋</div>
                      <div style={{ fontSize:15, color:BROWN, fontWeight:600, marginBottom:6 }}>No lists sent yet.</div>
                      <div style={{ fontSize:13, color:GRAY }}>Create your first work list to get started.</div>
                    </div>
                  )}
                  {sentLists.map(list => {
                    const { done, total } = getProgress(list);
                    const pct = total>0 ? Math.round((done/total)*100) : 0;
                    return (
                      <div key={list.id} style={s.historyCard}>
                        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:4 }}>
                          <span style={{ fontSize:11, color:GRAY }}>{list.date}</span>
                          <span style={{ ...s.historyBadge, background:pct===100?"#D4F0D4":WARM, color:pct===100?"#2D6A2D":BROWN }}>{done}/{total} ✓</span>
                        </div>
                        <div style={{ background:WARM, borderRadius:6, height:5, marginBottom:8, overflow:"hidden" }}>
                          <div style={{ background:pct===100?"#2D6A2D":GOLD, height:"100%", width:`${pct}%`, borderRadius:6, transition:"width 0.4s" }} />
                        </div>
                        <div style={{ fontSize:13, color:BROWN, fontWeight:600, marginBottom:6 }}>👨‍🍳 {list.bakers.join(", ")}</div>
                        {list.tasks.map(t => {
                          const isDone = !!(completions[list.id]||{})[t.id];
                          return (
                            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:8, fontSize:13, color:isDone?GRAY:"#444", marginBottom:4, textDecoration:isDone?"line-through":"none" }}>
                              <span style={{ fontSize:16 }}>{isDone?"✅":t.emoji}</span>
                              <span style={{ fontWeight:500 }}>{t.label}</span>
                              {t.quantity && <span style={{ color:GRAY, fontSize:12 }}>× {t.quantity}</span>}
                              {t.time && <span style={{ color:GRAY, fontSize:12 }}>⏰ {t.time}</span>}
                            </div>
                          );
                        })}
                        <button style={s.emailBtn} onClick={() => sendReport(list)}>📧 Email Report</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ===== CREATE ===== */}
              {screen==="create" && (
                <div>
                  <div style={s.sectionLabel}>Select Tasks {pickedIds.size>0 && <span style={s.pickedCount}>{pickedIds.size} selected</span>}</div>
                  <div style={s.taskGrid}>
                    {QUICK_TASKS.map(task => {
                      const picked = pickedIds.has(task.id);
                      return (
                        <div key={task.id} style={{ ...s.taskChip, ...(picked?s.taskChipPicked:{}) }} onClick={() => togglePick(task.id)}>
                          <div style={s.taskChipEmoji}>{task.emoji}</div>
                          <div style={s.taskChipLabel}>{task.label}</div>
                          {picked && <div style={s.taskChipCheck}>✓</div>}
                        </div>
                      );
                    })}
                  </div>
                  {customTasks.length>0 && (
                    <div style={{ ...s.taskGrid, marginTop:10 }}>
                      {customTasks.map(task => {
                        const picked = pickedIds.has(task.id);
                        return (
                          <div key={task.id} style={{ ...s.taskChip, ...(picked?s.taskChipPicked:{}), position:"relative" }} onClick={() => togglePick(task.id)}>
                            <div style={s.taskChipEmoji}>{task.emoji}</div>
                            <div style={s.taskChipLabel}>{task.label}</div>
                            {picked && <div style={s.taskChipCheck}>✓</div>}
                            <button style={s.customRemoveBtn} onClick={e => { e.stopPropagation(); removeCustomTask(task.id); }}>✕</button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {showCustomForm ? (
                    <div style={s.customForm}>
                      <div style={{ fontSize:12, fontWeight:700, color:GOLD, marginBottom:8 }}>NEW TASK</div>
                      <input style={{ ...s.input, marginBottom:10 }} placeholder="Task name (e.g. Ganache…)" value={customInput}
                        onChange={e => setCustomInput(e.target.value)}
                        onKeyDown={e => { if(e.key==="Enter") addCustomTask(); if(e.key==="Escape") setShowCustomForm(false); }} autoFocus />
                      <div style={{ display:"flex", gap:8 }}>
                        <button style={{ ...s.primaryBtn, marginBottom:0, flex:1, padding:"11px 0", fontSize:13 }} onClick={addCustomTask}>+ Add Task</button>
                        <button style={{ ...s.ghostBtn, marginBottom:0, flex:1, padding:"11px 0", fontSize:13 }} onClick={() => { setShowCustomForm(false); setCustomInput(""); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button style={s.addCustomBtn} onClick={() => setShowCustomForm(true)}>✏️ Add a custom task</button>
                  )}
                  {pickedIds.size>0 && (
                    <>
                      <div style={{ ...s.sectionLabel, marginTop:16 }}>Add Details (optional)</div>
                      {allTasks.filter(t => pickedIds.has(t.id)).map(task => {
                        const isOpen = expandedId===task.id;
                        const qty = getDetail(task.id,"quantity");
                        const tm = getDetail(task.id,"time");
                        const nt = getDetail(task.id,"notes");
                        return (
                          <div key={task.id} style={s.detailCard}>
                            <div style={s.detailHeader} onClick={() => setExpandedId(isOpen?null:task.id)}>
                              <span style={{ fontSize:20 }}>{task.emoji}</span>
                              <span style={s.detailLabel}>{task.label}</span>
                              {(qty||tm||nt) && <span style={s.detailDot} />}
                              <span style={{ color:GOLD, fontSize:16 }}>{isOpen?"▲":"▼"}</span>
                            </div>
                            {isOpen && (
                              <div style={s.detailBody}>
                                <div style={{ display:"flex", gap:10 }}>
                                  <div style={{ flex:1 }}><label style={s.label}>Quantity</label><input style={s.inputSmall} placeholder="e.g. 120" value={qty} onChange={e => updateDetail(task.id,"quantity",e.target.value)} /></div>
                                  <div style={{ flex:1 }}><label style={s.label}>Time</label><input style={s.inputSmall} placeholder="e.g. 06:00" value={tm} onChange={e => updateDetail(task.id,"time",e.target.value)} /></div>
                                </div>
                                <label style={s.label}>Notes</label>
                                <textarea style={s.textarea} placeholder="Instructions..." value={nt} onChange={e => updateDetail(task.id,"notes",e.target.value)} rows={2} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}
                  <button style={{ ...s.primaryBtn, marginTop:16, opacity:pickedIds.size>0?1:0.4 }} disabled={pickedIds.size===0} onClick={() => setScreen("send")}>
                    Next → Choose Pastry Chefs ({pickedIds.size} task{pickedIds.size!==1?"s":""})
                  </button>
                </div>
              )}

              {/* ===== SEND ===== */}
              {screen==="send" && (
                <div>
                  <div style={s.sectionLabel}>Select Pastry Chefs</div>
                  {patissiers.map(name => (
                    <div key={name} style={{ ...s.patissierCard, ...(selectedBakers.includes(name)?s.patissierSelected:{}) }} onClick={() => toggleBaker(name)}>
                      <div style={s.avatar}>{name[0]}</div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontSize:15, fontWeight:600, color:BROWN }}>{name}</div>
                        {bakerEmails[name] && <div style={{ fontSize:11, color:GRAY, marginTop:1 }}>{bakerEmails[name]}</div>}
                      </div>
                      {selectedBakers.includes(name) && <span style={{ color:GOLD, fontSize:18, fontWeight:700 }}>✓</span>}
                    </div>
                  ))}
                  <div style={s.sectionLabel}>Summary</div>
                  <div style={s.recapCard}>
                    {pickedTasks.map(t => {
                      const qty = getDetail(t.id,"quantity"); const tm = getDetail(t.id,"time"); const nt = getDetail(t.id,"notes");
                      return (
                        <div key={t.id} style={{ display:"flex", gap:10, paddingBottom:10, borderBottom:`1px solid ${WARM}`, marginBottom:10 }}>
                          <span style={{ fontSize:20, flexShrink:0 }}>{t.emoji}</span>
                          <div style={{ flex:1 }}>
                            <div style={{ fontSize:14, fontWeight:600, color:BROWN }}>{t.label}</div>
                            <div style={{ fontSize:12, color:GRAY, marginTop:2 }}>
                              {qty&&`Qty: ${qty}`}{qty&&tm&&" · "}{tm&&`⏰ ${tm}`}
                              {nt&&<div style={{ fontSize:11, color:"#999", marginTop:2 }}>📝 {nt}</div>}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <button style={{ ...s.primaryBtn, opacity:canSend?1:0.4 }} disabled={!canSend} onClick={handleSend}>📤 Send Work List</button>
                </div>
              )}

              {/* ===== CONFIRM ===== */}
              {screen==="confirm" && (
                <div style={{ display:"flex", flexDirection:"column", alignItems:"center", paddingTop:30 }}>
                  <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
                  <div style={{ fontSize:24, fontWeight:800, color:BROWN, marginBottom:6 }}>List Sent!</div>
                  <div style={{ fontSize:14, color:"#555", marginBottom:4 }}>Assigned to: <strong>{sentTo.join(", ")}</strong></div>
                  <div style={{ fontSize:13, color:GRAY, marginBottom:20 }}>{pickedTasks.length} task{pickedTasks.length!==1?"s":""} assigned</div>
                  <div style={{ background:"#FFF8ED", border:`1.5px solid ${GOLD}`, borderRadius:12, padding:"12px 14px", display:"flex", alignItems:"flex-start", gap:10, fontSize:13, color:BROWN, width:"100%", marginBottom:16, boxSizing:"border-box" }}>
                    <span style={{ fontSize:16 }}>💡</span><span>Ziggy & Jan can open the app, select their name, and tick off tasks as they complete them.</span>
                  </div>
                  <button style={s.primaryBtn} onClick={() => sendReport(sentLists[0])}>📧 Email Report Now</button>
                  <button style={s.primaryBtn} onClick={reset}>+ New Work List</button>
                  <button style={s.ghostBtn} onClick={() => setScreen("home")}>View History</button>
                </div>
              )}

              {/* ===== BAKE OFF ===== */}
              {screen==="bakeoff" && (
                <div>
                  {/* Date */}
                  <div style={s.bakeoffDateCard}>
                    <span style={{ fontSize:14 }}>📅</span>
                    <input
                      style={{ ...s.input, flex:1, background:"transparent", border:"none", padding:"0", fontSize:13, fontWeight:600, color:BROWN, outline:"none" }}
                      value={bakeoffDate}
                      onChange={e => setBakeoffDate(e.target.value)}
                      placeholder="Date for this Bake Off list"
                    />
                  </div>

                  <div style={s.sectionLabel}>
                    Enter Quantities
                    {bakeoffCount>0 && <span style={s.pickedCount}>{bakeoffCount} items</span>}
                  </div>

                  {/* Task rows */}
                  {allTasks.map(task => (
                    <div key={task.id} style={{ ...s.bakeoffRow, ...(bakeoffQty[task.id]?s.bakeoffRowFilled:{}) }}>
                      <span style={{ fontSize:22, width:32, textAlign:"center", flexShrink:0 }}>{task.emoji}</span>
                      <span style={s.bakeoffRowLabel}>{task.label}</span>
                      <input
                        style={s.bakeoffInput}
                        type="number"
                        inputMode="numeric"
                        placeholder="—"
                        value={bakeoffQty[task.id] || ""}
                        onChange={e => {
                          const v = e.target.value;
                          setBakeoffQty(prev => v ? { ...prev, [task.id]: v } : (() => { const n={...prev}; delete n[task.id]; return n; })());
                        }}
                      />
                    </div>
                  ))}

                  <div style={{ height:12 }} />

                  {/* History */}
                  {bakeoffSentLists.length>0 && (
                    <>
                      <div style={s.sectionLabel}>History</div>
                      {bakeoffSentLists.map(list => (
                        <div key={list.id} style={s.historyCard}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                            <div style={{ fontSize:12, fontWeight:700, color:BROWN }}>📅 {list.date}</div>
                            <span style={s.historyBadge}>{list.items.length} items</span>
                          </div>
                          {list.items.map(t => (
                            <div key={t.id} style={{ display:"flex", alignItems:"center", gap:10, fontSize:13, marginBottom:5 }}>
                              <span style={{ fontSize:16 }}>{t.emoji}</span>
                              <span style={{ flex:1, color:BROWN, fontWeight:500 }}>{t.label}</span>
                              <span style={s.bakeoffQtyBadge}>{t.qty}</span>
                            </div>
                          ))}
                          <button style={s.emailBtn} onClick={() => emailBakeoff(list)}>📧 Email this list</button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}

              {/* ===== REPORT ===== */}
              {screen==="report" && (
                <div>
                  <div style={s.sectionLabel}>Email Reports</div>
                  {sentLists.length===0 && (
                    <div style={s.emptyState}>
                      <div style={{ fontSize:48, marginBottom:12 }}>📧</div>
                      <div style={{ fontSize:15, color:BROWN, fontWeight:600, marginBottom:6 }}>No reports yet.</div>
                      <div style={{ fontSize:13, color:GRAY }}>Send a work list first.</div>
                    </div>
                  )}
                  {sentLists.map(list => {
                    const { done, total } = getProgress(list);
                    const pct = total>0 ? Math.round((done/total)*100) : 0;
                    return (
                      <div key={list.id} style={s.historyCard}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                          <div><div style={{ fontSize:12, fontWeight:700, color:BROWN }}>{list.date}</div><div style={{ fontSize:11, color:GRAY }}>👨‍🍳 {list.bakers.join(", ")}</div></div>
                          <div style={{ textAlign:"right" }}><div style={{ fontSize:13, fontWeight:700, color:pct===100?"#2D6A2D":GOLD }}>{pct}%</div><div style={{ fontSize:10, color:GRAY }}>{done}/{total} done</div></div>
                        </div>
                        <div style={{ background:WARM, borderRadius:6, height:5, marginBottom:10, overflow:"hidden" }}>
                          <div style={{ background:pct===100?"#2D6A2D":GOLD, height:"100%", width:`${pct}%`, borderRadius:6 }} />
                        </div>
                        <button style={s.emailBtn} onClick={() => sendReport(list)}>📧 Send Report by Email</button>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* ===== SETTINGS ===== */}
              {screen==="settings" && (
                <div>
                  <div style={s.sectionLabel}>Admin</div>
                  <div style={s.settingsCard}>
                    <label style={s.label}>Your Email (Admin)</label>
                    <input style={s.input} placeholder="admin@example.com" value={adminEmail} onChange={e => setAdminEmail(e.target.value)} />
                    <div style={{ fontSize:11, color:GRAY, marginTop:6 }}>You'll be CC'd on all reports.</div>
                  </div>
                  <div style={s.sectionLabel}>Pastry Chefs</div>
                  {patissiers.map(name => (
                    <div key={name} style={s.settingsCard}>
                      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8 }}>
                        <div style={{ ...s.avatar, width:32, height:32, fontSize:14 }}>{name[0]}</div>
                        <span style={{ flex:1, fontSize:15, fontWeight:700, color:BROWN }}>{name}</span>
                        <button style={s.removeBakerBtn} onClick={() => removeBaker(name)}>✕ Remove</button>
                      </div>
                      <input style={s.input} placeholder={`${name.toLowerCase()}@example.com`} value={bakerEmails[name] || ""} onChange={e => setBakerEmails(prev => ({ ...prev, [name]:e.target.value }))} />
                    </div>
                  ))}
                  {showAddBaker ? (
                    <div style={s.addBakerForm}>
                      <div style={{ fontSize:12, fontWeight:700, color:GOLD, marginBottom:8, letterSpacing:0.5 }}>NEW PASTRY CHEF</div>
                      <input
                        style={{ ...s.input, marginBottom:10 }}
                        placeholder="Name (e.g. Sarah)"
                        value={newBakerName}
                        onChange={e => setNewBakerName(e.target.value)}
                        onKeyDown={e => { if(e.key==="Enter") addBaker(); if(e.key==="Escape") setShowAddBaker(false); }}
                        autoFocus
                      />
                      <div style={{ display:"flex", gap:8 }}>
                        <button style={{ ...s.primaryBtn, marginBottom:0, flex:1, padding:"11px 0", fontSize:13 }} onClick={addBaker}>+ Add</button>
                        <button style={{ ...s.ghostBtn, marginBottom:0, flex:1, padding:"11px 0", fontSize:13 }} onClick={() => { setShowAddBaker(false); setNewBakerName(""); }}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <button style={s.addBakerBtn} onClick={() => setShowAddBaker(true)}>+ Add Pastry Chef</button>
                  )}
                  <div style={s.sectionLabel}>Security</div>
                  <div style={s.settingsCard}>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={s.label}>Admin PIN</span>
                      <span style={{ fontSize:14, color:BROWN, letterSpacing:4 }}>● ● ● ●</span>
                    </div>
                    <div style={{ fontSize:11, color:GRAY, marginTop:6 }}>Default PIN: 1234</div>
                  </div>
                  <button style={s.primaryBtn} onClick={() => setScreen("home")}>Save & Return</button>
                </div>
              )}

            </div>

            {/* BAKE OFF sticky footer */}
            {screen==="bakeoff" && bakeoffCount>0 && (
              <div style={s.bakeoffFooter}>
                <button style={s.bakeoffClearBtn} onClick={clearBakeoff}>Clear</button>
                <button style={s.bakeoffSaveBtn} onClick={saveBakeoffList}>
                  💾 Save List ({bakeoffCount})
                </button>
                <button style={s.bakeoffEmailBtn} onClick={() => {
                  const tmp = { id:0, date:bakeoffDate, items:QUICK_TASKS.filter(t=>bakeoffQty[t.id]).map(t=>({...t,qty:bakeoffQty[t.id]})) };
                  emailBakeoff(tmp);
                }}>📧</button>
              </div>
            )}

            {/* NAV BAR */}
            {screen!=="bakeoff" ? (
              <div style={s.navBar}>
                {[["home","📋","Home"],["create","✏️","Create"],["bakeoff","🏪","Bake Off"],["report","📧","Reports"],["settings","⚙️","Settings"]].map(([sc,icon,label]) => (
                  <button key={sc} style={{ ...s.navBtn, ...(screen===sc?s.navActive:{}) }} onClick={() => setScreen(sc)}>
                    <div style={{ fontSize:16 }}>{icon}</div>
                    <div style={{ fontSize:9, fontWeight:600, color:BROWN }}>{label}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div style={s.navBar}>
                {[["home","📋","Home"],["create","✏️","Create"],["bakeoff","🏪","Bake Off"],["report","📧","Reports"],["settings","⚙️","Settings"]].map(([sc,icon,label]) => (
                  <button key={sc} style={{ ...s.navBtn, ...(screen===sc?s.navActive:{}) }} onClick={() => setScreen(sc)}>
                    <div style={{ fontSize:16 }}>{icon}</div>
                    <div style={{ fontSize:9, fontWeight:600, color:BROWN }}>{label}</div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const BROWN="#3B1F0E", GOLD="#C8902A", CREAM="#FDF6EC", WARM="#F5E6CC", WHITE="#FFFFFF", GRAY="#888", LIGHT="#FAF0DE";

const s = {
  shell:{ minHeight:"100vh", background:"linear-gradient(135deg,#2C1503 0%,#6B3A1F 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:"24px 16px", fontFamily:"'Segoe UI',system-ui,sans-serif" },
  phone:{ width:390, minHeight:780, maxHeight:820, background:CREAM, borderRadius:40, overflow:"hidden", display:"flex", flexDirection:"column", boxShadow:"0 32px 80px rgba(0,0,0,0.6),0 0 0 2px #5C3010" },
  statusBar:{ background:BROWN, color:WARM, display:"flex", justifyContent:"space-between", padding:"8px 20px", fontSize:11, letterSpacing:0.5 },

  lockPage:{ flex:1, background:BROWN, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", padding:"30px 24px", gap:8 },
  lockTitle:{ color:WHITE, fontSize:19, fontWeight:800, letterSpacing:0.8 },
  lockSub:{ color:WARM, fontSize:13, opacity:0.75, marginBottom:8 },
  lockRoleBtn:{ background:"rgba(255,255,255,0.1)", border:"1.5px solid rgba(255,255,255,0.2)", color:WHITE, borderRadius:16, padding:"16px 20px", display:"flex", alignItems:"center", gap:16, cursor:"pointer", textAlign:"left", width:"100%" },
  bakerSelectBtn:{ background:"rgba(255,255,255,0.12)", border:"1.5px solid rgba(255,255,255,0.2)", color:WHITE, borderRadius:16, padding:"18px 20px", display:"flex", alignItems:"center", gap:16, cursor:"pointer", width:"100%" },
  bakerAvatarLg:{ width:44, height:44, borderRadius:"50%", background:GOLD, color:WHITE, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:20, flexShrink:0 },

  pinDot:{ width:14, height:14, borderRadius:"50%", border:`2px solid ${WARM}`, background:"transparent" },
  pinDotFilled:{ background:GOLD, borderColor:GOLD },
  pinDotError:{ background:"#E05555", borderColor:"#E05555" },
  pinGrid:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginTop:16, width:220 },
  pinBtn:{ background:"rgba(255,255,255,0.1)", border:"none", color:WHITE, borderRadius:14, padding:"16px 0", fontSize:20, fontWeight:600, cursor:"pointer" },

  header:{ background:BROWN, color:WHITE, padding:"12px 16px 16px", display:"flex", alignItems:"center", gap:10 },
  headerTitle:{ fontSize:17, fontWeight:800, letterSpacing:0.3 },
  backBtn:{ background:"rgba(255,255,255,0.15)", border:"none", color:WHITE, borderRadius:10, padding:"6px 10px", fontSize:16, cursor:"pointer", flexShrink:0 },
  iconBtn:{ background:"rgba(255,255,255,0.12)", border:"none", color:WHITE, borderRadius:10, padding:"6px 9px", fontSize:15, cursor:"pointer" },
  avatar:{ width:38, height:38, borderRadius:"50%", background:BROWN, color:WHITE, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:16, flexShrink:0 },

  scroll:{ flex:1, overflowY:"auto", padding:"16px", paddingBottom:0 },
  sectionLabel:{ fontSize:11, fontWeight:700, color:GOLD, letterSpacing:1.2, textTransform:"uppercase", marginTop:8, marginBottom:10, display:"flex", alignItems:"center", gap:8 },
  pickedCount:{ background:GOLD, color:WHITE, borderRadius:20, padding:"2px 9px", fontSize:11, fontWeight:700, letterSpacing:0 },

  primaryBtn:{ width:"100%", background:BROWN, color:WHITE, border:"none", borderRadius:14, padding:"15px 0", fontSize:15, fontWeight:700, cursor:"pointer", marginBottom:12 },
  ghostBtn:{ width:"100%", background:"transparent", color:BROWN, border:`2px solid ${BROWN}`, borderRadius:14, padding:"13px 0", fontSize:15, fontWeight:600, cursor:"pointer", marginBottom:12 },
  emailBtn:{ width:"100%", background:"#FFF3E0", color:BROWN, border:`1.5px solid ${GOLD}`, borderRadius:10, padding:"10px 0", fontSize:13, fontWeight:700, cursor:"pointer", marginTop:10 },

  taskGrid:{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:10, marginBottom:4 },
  taskChip:{ background:WHITE, border:`1.5px solid ${WARM}`, borderRadius:14, padding:"12px 6px 10px", display:"flex", flexDirection:"column", alignItems:"center", gap:4, cursor:"pointer", position:"relative" },
  taskChipPicked:{ background:"#FFF8ED", border:`2px solid ${GOLD}`, boxShadow:`0 0 0 2px ${GOLD}22` },
  taskChipEmoji:{ fontSize:24 },
  taskChipLabel:{ fontSize:11, fontWeight:600, color:BROWN, textAlign:"center", lineHeight:1.2 },
  taskChipCheck:{ position:"absolute", top:5, right:7, fontSize:11, fontWeight:800, color:GOLD },
  customRemoveBtn:{ position:"absolute", top:4, left:6, background:"#FFE5E5", border:"none", color:"#C00", borderRadius:6, padding:"1px 5px", fontSize:10, cursor:"pointer", lineHeight:1.4 },
  addCustomBtn:{ width:"100%", background:WARM, color:BROWN, border:`1.5px dashed ${GOLD}`, borderRadius:12, padding:"11px 0", fontSize:13, fontWeight:600, cursor:"pointer", marginTop:10 },
  customForm:{ background:WHITE, border:`1.5px solid ${GOLD}`, borderRadius:14, padding:"14px", marginTop:10 },

  detailCard:{ background:WHITE, borderRadius:14, marginBottom:8, border:`1px solid ${WARM}`, overflow:"hidden" },
  detailHeader:{ display:"flex", alignItems:"center", gap:10, padding:"12px 14px", cursor:"pointer" },
  detailLabel:{ flex:1, fontSize:14, fontWeight:600, color:BROWN },
  detailDot:{ width:7, height:7, borderRadius:"50%", background:GOLD, flexShrink:0 },
  detailBody:{ padding:"0 14px 14px", borderTop:`1px solid ${WARM}` },

  label:{ display:"block", fontSize:11, fontWeight:600, color:BROWN, marginBottom:4, marginTop:8, letterSpacing:0.3 },
  input:{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${WARM}`, fontSize:14, color:BROWN, background:LIGHT, boxSizing:"border-box", outline:"none" },
  inputSmall:{ width:"100%", padding:"10px", borderRadius:10, border:`1.5px solid ${WARM}`, fontSize:14, color:BROWN, background:LIGHT, boxSizing:"border-box", outline:"none" },
  textarea:{ width:"100%", padding:"10px 12px", borderRadius:10, border:`1.5px solid ${WARM}`, fontSize:13, color:BROWN, background:LIGHT, boxSizing:"border-box", resize:"none", fontFamily:"inherit", outline:"none" },

  patissierCard:{ background:WHITE, border:`1.5px solid ${WARM}`, borderRadius:14, padding:"14px 16px", marginBottom:10, display:"flex", alignItems:"center", gap:12, cursor:"pointer" },
  patissierSelected:{ background:"#FFF8ED", border:`2px solid ${GOLD}` },
  recapCard:{ background:WHITE, borderRadius:14, padding:"12px 14px", marginBottom:16, border:`1px solid ${WARM}` },

  bakerListCard:{ background:WHITE, borderRadius:16, padding:16, marginBottom:14, border:`1px solid ${WARM}`, boxShadow:"0 2px 8px rgba(59,31,14,0.08)" },
  taskCheckRow:{ display:"flex", alignItems:"flex-start", gap:12, padding:"12px 0", borderBottom:`1px solid ${WARM}`, cursor:"pointer" },
  taskCheckRowDone:{ opacity:0.6 },
  checkbox:{ width:24, height:24, borderRadius:7, border:`2px solid ${WARM}`, background:LIGHT, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:1 },
  checkboxDone:{ background:"#2D6A2D", borderColor:"#2D6A2D" },
  taskMeta:{ fontSize:11, color:GRAY, background:WARM, borderRadius:6, padding:"2px 7px" },
  taskNote:{ fontSize:11, color:"#999", marginTop:4 },

  // BAKE OFF
  bakeoffDateCard:{ background:WHITE, border:`1.5px solid ${WARM}`, borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:10, marginBottom:14 },
  bakeoffRow:{ background:WHITE, border:`1.5px solid ${WARM}`, borderRadius:12, padding:"10px 14px", display:"flex", alignItems:"center", gap:12, marginBottom:8 },
  bakeoffRowFilled:{ background:"#FFFAF0", border:`1.5px solid ${GOLD}` },
  bakeoffRowLabel:{ flex:1, fontSize:14, fontWeight:600, color:BROWN },
  bakeoffInput:{ width:70, padding:"8px 10px", borderRadius:10, border:`1.5px solid ${WARM}`, fontSize:16, fontWeight:700, color:BROWN, background:LIGHT, textAlign:"center", outline:"none", boxSizing:"border-box" },
  bakeoffQtyBadge:{ background:GOLD, color:WHITE, borderRadius:8, padding:"3px 10px", fontSize:13, fontWeight:800 },
  bakeoffFooter:{ background:BROWN, padding:"12px 16px", display:"flex", gap:10, alignItems:"center" },
  bakeoffSaveBtn:{ flex:1, background:GOLD, color:WHITE, border:"none", borderRadius:12, padding:"12px 0", fontSize:14, fontWeight:700, cursor:"pointer" },
  bakeoffEmailBtn:{ background:"rgba(255,255,255,0.15)", border:"none", color:WHITE, borderRadius:12, padding:"12px 14px", fontSize:16, cursor:"pointer" },
  bakeoffClearBtn:{ background:"rgba(255,255,255,0.1)", border:"none", color:WARM, borderRadius:12, padding:"12px 14px", fontSize:13, cursor:"pointer" },

  bakerTabs:{ display:"flex", background:"#0F2A0F", borderBottom:"2px solid #1A3A1A" },
  bakerTab:{ flex:1, background:"none", border:"none", color:"#A8D5A8", padding:"11px 0", fontSize:13, fontWeight:600, cursor:"pointer", opacity:0.6 },
  bakerTabActive:{ color:WHITE, opacity:1, borderBottom:"3px solid #4CAF50", background:"rgba(255,255,255,0.05)" },
  bakerTabActiveBakeoff:{ color:"#FFD580", opacity:1, borderBottom:"3px solid #FFD580", background:"rgba(255,255,255,0.05)" },
  bakeoffBakerRow:{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:`1px solid ${WARM}` },
  historyCard:{ background:WHITE, borderRadius:14, padding:14, marginBottom:12, border:`1px solid ${WARM}`, boxShadow:"0 1px 4px rgba(59,31,14,0.06)" },
  historyBadge:{ background:WARM, color:BROWN, borderRadius:8, padding:"2px 8px", fontSize:11, fontWeight:600 },
  settingsCard:{ background:WHITE, borderRadius:14, padding:"14px 16px", marginBottom:12, border:`1px solid ${WARM}` },
  removeBakerBtn:{ background:"#FFE5E5", border:"none", color:"#C00", borderRadius:8, padding:"5px 10px", fontSize:11, fontWeight:700, cursor:"pointer" },
  addBakerBtn:{ width:"100%", background:WARM, color:BROWN, border:`1.5px dashed ${GOLD}`, borderRadius:12, padding:"12px 0", fontSize:14, fontWeight:600, cursor:"pointer", marginBottom:12 },
  addBakerForm:{ background:WHITE, border:`1.5px solid ${GOLD}`, borderRadius:14, padding:"14px", marginBottom:12 },
  emptyState:{ textAlign:"center", padding:"40px 20px" },
  navBar:{ background:WHITE, borderTop:`1px solid ${WARM}`, display:"flex", justifyContent:"space-around", padding:"8px 0 12px" },
  navBtn:{ background:"none", border:"none", cursor:"pointer", display:"flex", flexDirection:"column", alignItems:"center", gap:2, padding:"4px 10px", borderRadius:12 },
  navActive:{ background:WARM },
};
