import { useState, useEffect } from "react";

const ALL_DRUGS = [
  { id: "med", name: "Medetomidine", calc: (w) => (0.2 * w) / 10 },
  { id: "ket", name: "Ketamine", calc: (w) => (3 * w) / 100 },
  { id: "but", name: "Butorphanol", calc: (w) => (0.1 * w) / 10 },
  { id: "acp", name: "ACP", calc: (w) => (0.06 * w) / 2 },
];

const DAYS_WARNING = 28;
const DAYS_DANGER = 35;

export default function App() {
  const [weight, setWeight] = useState("");
  const [patient, setPatient] = useState("");
  const [ownerSurname, setOwnerSurname] = useState("");
  const [records, setRecords] = useState([]);
  const [overrides, setOverrides] = useState({});
  const [stock, setStock] = useState({});

  const [activeDrugs, setActiveDrugs] = useState(
  ALL_DRUGS.map(d => d.id)
);

  useEffect(() => {
    const saved = localStorage.getItem("sedationRecords");
    if (saved) setRecords(JSON.parse(saved));
    const savedStock = localStorage.getItem("drugStock");
    if (savedStock) setStock(JSON.parse(savedStock));
  }, []);

  useEffect(() => {
    localStorage.setItem("sedationRecords", JSON.stringify(records));
  }, [records]);

  useEffect(() => {
    localStorage.setItem("drugStock", JSON.stringify(stock));
  }, [stock]);

  const daysSince = (date) => {
    if (!date) return 0;
    return Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (date) => {
    const days = daysSince(date);
    if (days >= DAYS_DANGER) return "#e53935";
    if (days >= DAYS_WARNING) return "#fb8c00";
    return "#4caf50";
  };

  const calculateDoses = () => {
    return ALL_DRUGS.map((drug) => {
      const calculated = drug.calc(parseFloat(weight) || 0).toFixed(2);
      const overridden = overrides[drug.id];
      return {
        id: drug.id,
        name: drug.name,
        volume: overridden !== undefined && overridden !== "" ? overridden : calculated,
      };
    });
  };

  const handleOverride = (id, value) => {
    setOverrides(prev => ({ ...prev, [id]: value }));
  };

const toggleDrug = (id) => {
  setActiveDrugs(prev =>
    prev.includes(id)
      ? prev.filter(d => d !== id)
      : [...prev, id]
  );
};

  const handleStockChange = (id, field, value) => {
    setStock(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleDiscard = (id) => {
    setStock(prev => ({
      ...prev,
      [id]: { batch: "", broach: "", total: "" }
    }));
  };

  const handleSave = () => {
    if (!patient || !ownerSurname) return alert("Enter patient + owner");

    const doses = calculateDoses();
    const updatedStock = { ...stock };

    // LOCK batch + broach into record
    const lockedMeta = {};

    doses.forEach(d => {
      const current = parseFloat(updatedStock[d.id]?.total || 0);
      const used = parseFloat(d.volume);

      updatedStock[d.id] = {
        ...updatedStock[d.id],
        total: (current - used).toFixed(2),
      };

      lockedMeta[d.id] = {
        batch: updatedStock[d.id]?.batch || "",
        broach: updatedStock[d.id]?.broach || "",
      };
    });

    setStock(updatedStock);

    const newRecord = {
      patient,
      ownerSurname,
      weight,
      doses,
      meta: lockedMeta,
      date: new Date().toLocaleString(),
    };

    setRecords([newRecord, ...records]);

    // fast reset for next patient
    setOverrides({});
    setWeight("");
    setPatient("");
    setOwnerSurname("");
  };

  const handleDelete = (index) => {
    const rec = records[index];
    const updatedStock = { ...stock };

    rec.doses.forEach(d => {
      const current = parseFloat(updatedStock[d.id]?.total || 0);
      const restore = parseFloat(d.volume);
      updatedStock[d.id] = {
        ...updatedStock[d.id],
        total: (current + restore).toFixed(2),
      };
    });

    setStock(updatedStock);
    setRecords(records.filter((_, i) => i !== index));
  };

  const downloadCSV = () => {
    const headers = ["Patient","Owner","Weight","Drug","Volume","Batch","Broach","Date"];
    const rows = [];

    records.forEach(r => {
      r.doses.forEach(d => {
        rows.push([
          r.patient,
          r.ownerSurname,
          r.weight,
          d.name,
          d.volume,
          r.meta?.[d.id]?.batch || "",
          r.meta?.[d.id]?.broach || "",
          r.date
        ]);
      });
    });

    const csv = [headers, ...rows].map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "sedation-report.csv";
    a.click();
  };

  return (
    <div style={appBg}>

      <div style={card}>
        <h2 style={title}>Sedation</h2>

        <input placeholder="Patient" value={patient} onChange={(e)=>setPatient(e.target.value)} style={input}/>
        <input placeholder="Owner" value={ownerSurname} onChange={(e)=>setOwnerSurname(e.target.value)} style={input}/>
        <input type="number" placeholder="Weight" value={weight} onChange={(e)=>setWeight(e.target.value)} style={input}/>

<div style={{ marginBottom: 12 }}>
  <strong style={{ fontSize: 14, color: "#3a7ca5" }}>
    Select Drugs
  </strong>

  {ALL_DRUGS.map(d => (
    <div key={d.id} style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: 6,
      padding: 10,
      background: "#f4f7fb",
      borderRadius: 10
    }}>
      <span>{d.name}</span>

      <button
        onClick={() => toggleDrug(d.id)}
        style={{
          background: activeDrugs.includes(d.id) ? "#3a7ca5" : "#ccc",
          color: "white",
          border: "none",
          borderRadius: 20,
          padding: "6px 12px",
          fontSize: 12
        }}
      >
        {activeDrugs.includes(d.id) ? "On" : "Off"}
      </button>
    </div>
  ))}
</div>

      {calculateDoses()
  .filter(d => activeDrugs.includes(d.id))
  .map(d => (
          <div key={d.id} style={drugRow}>
            <span>{d.name}</span>
            <input
              type="number"
              value={d.volume}
              onChange={(e)=>handleOverride(d.id,e.target.value)}
              style={dose}
            />
          </div>
        ))}

        <button onClick={handleSave} style={primaryBtn}>Save</button>
      </div>

      <div style={card}>
        <h3>Stock</h3>
        {ALL_DRUGS.map(d => (
          <div key={d.id} style={{...stockRow, borderLeft:`4px solid ${getStatusColor(stock[d.id]?.broach)}`}}>
            <strong>{d.name}</strong>
            <input placeholder="Batch" value={stock[d.id]?.batch || ""} onChange={(e)=>handleStockChange(d.id,"batch",e.target.value)} style={input}/>
            <input type="date" value={stock[d.id]?.broach || ""} onChange={(e)=>handleStockChange(d.id,"broach",e.target.value)} style={input}/>
            <input type="number" placeholder="ml" value={stock[d.id]?.total || ""} onChange={(e)=>handleStockChange(d.id,"total",e.target.value)} style={input}/>
            <button onClick={()=>handleDiscard(d.id)} style={dangerBtn}>Discard</button>
          </div>
        ))}
      </div>

      <div style={{maxWidth:420,margin:"10px auto"}}>
        <button onClick={downloadCSV} style={primaryBtn}>Download Report</button>

        {records.map((rec,i)=>(
          <div key={i} style={recordCard}>
            <div style={{display:"flex",justifyContent:"space-between"}}>
              <strong>{rec.patient}</strong>
              <button onClick={()=>handleDelete(i)} style={deleteBtn}>✕</button>
            </div>

            {rec.doses.map((d,idx)=>(
              <div key={idx}>
                {d.name}: {d.volume} ml 
                <span style={{fontSize:10,color:"#666"}}>
                  ({rec.meta?.[d.id]?.batch || ""})
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// 🎨 STYLES (mobile-native feel)

const appBg = {
  fontFamily:"Arial",
  background:"linear-gradient(135deg,#5fa8d3,#3a7ca5)",
  minHeight:"100vh",
  padding:10
};

const card = {
  maxWidth:420,
  margin:"10px auto",
  background:"white",
  borderRadius:20,
  padding:18,
  boxShadow:"0 8px 20px rgba(0,0,0,0.15)"
};

const title = { textAlign:"center", color:"#3a7ca5" };

const input = {
  width:"100%",
  padding:14,
  marginBottom:8,
  borderRadius:12,
  border:"1px solid #ccc",
  fontSize:16,
  boxSizing:"border-box" // 👈 ADD THIS LINE
};

const drugRow = {
  display:"flex",
  justifyContent:"space-between",
  alignItems:"center",
  marginBottom:8,
  padding:10,
  background:"#f4f7fb",
  borderRadius:12
};

const dose = {
  width:80,
  padding:10,
  fontSize:16,
  borderRadius:10
};

const stockRow = {
  display:"flex",
  flexDirection:"column",
  marginBottom:10,
  padding:10,
  borderRadius:12,
  background:"#f7f9fb"
};

const primaryBtn = {
  width:"100%",
  padding:16,
  marginTop:10,
  background:"#3a7ca5",
  color:"white",
  border:"none",
  borderRadius:14,
  fontSize:16
};

const dangerBtn = {
  background:"#e53935",
  color:"white",
  border:"none",
  borderRadius:10,
  padding:10,
  marginTop:5
};

const deleteBtn = {
  background:"#e53935",
  color:"white",
  border:"none",
  borderRadius:8,
  padding:"4px 8px"
};

const recordCard = {
  background:"white",
  padding:14,
  borderRadius:14,
  marginBottom:10,
  boxShadow:"0 4px 10px rgba(0,0,0,0.1)"
};
