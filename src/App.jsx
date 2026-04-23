import { useState, useEffect } from "react";

const ALL_DRUGS = [ { id: "med", name: "Medetomidine", calc: (w) => (0.2 * w) / 10 }, { id: "ket", name: "Ketamine", calc: (w) => (3 * w) / 100 }, { id: "but", name: "Butorphanol", calc: (w) => (0.1 * w) / 10 }, { id: "acp", name: "ACP", calc: (w) => (0.06 * w) / 2 }, ];

export default function App() { const [weight, setWeight] = useState(""); const [patient, setPatient] = useState(""); const [ownerSurname, setOwnerSurname] = useState(""); const [records, setRecords] = useState([]); const [search, setSearch] = useState(""); const [activeDrugs, setActiveDrugs] = useState(ALL_DRUGS.map(d => d.id)); const [customTotal, setCustomTotal] = useState("");

useEffect(() => { const saved = localStorage.getItem("sedationRecords"); if (saved) setRecords(JSON.parse(saved)); }, []);

useEffect(() => { localStorage.setItem("sedationRecords", JSON.stringify(records)); }, [records]);

const toggleDrug = (id) => { setActiveDrugs(prev => prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id] ); };

const selectedDrugs = ALL_DRUGS.filter(d => activeDrugs.includes(d.id));

const calculateDoses = () => { return selectedDrugs.map((drug) => ({ name: drug.name, volume: drug.calc(parseFloat(weight) || 0).toFixed(2), })); };

const totalCalculated = calculateDoses() .reduce((sum, d) => sum + parseFloat(d.volume), 0) .toFixed(2);

const finalTotal = customTotal !== "" ? customTotal : totalCalculated;

const handleSave = () => { if (!patient || !ownerSurname) return alert("Enter patient and owner surname");

const newRecord = {
  patient,
  ownerSurname,
  weight,
  doses: calculateDoses(),
  total: finalTotal,
  date: new Date().toLocaleString(),
};

setRecords([newRecord, ...records]);
setCustomTotal("");

};

const handleDelete = (index) => { const updated = records.filter((_, i) => i !== index); setRecords(updated); };

const filteredRecords = records.filter(r => ${r.patient} ${r.ownerSurname}.toLowerCase().includes(search.toLowerCase()) );

return ( <div style={{ padding: 20, fontFamily: "Arial", background: "#f1f3f4" }}> <div style={{ maxWidth: 500, margin: "0 auto", background: "white", padding: 20, borderRadius: 10 }}> <h1>Sedation Calculator</h1>

<label>Patient Name</label>
    <input value={patient} onChange={(e) => setPatient(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 10 }} />

    <label>Owner Surname</label>
    <input value={ownerSurname} onChange={(e) => setOwnerSurname(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 10 }} />

    <label>Weight (kg)</label>
    <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} style={{ width: "100%", padding: 8, marginBottom: 15 }} />

    <div style={{ marginBottom: 15 }}>
      <strong>Select Drugs:</strong>
      {ALL_DRUGS.map(d => (
        <div key={d.id}>
          <label>
            <input
              type="checkbox"
              checked={activeDrugs.includes(d.id)}
              onChange={() => toggleDrug(d.id)}
            /> {d.name}
          </label>
        </div>
      ))}
    </div>

    {calculateDoses().map((drug) => (
      <div key={drug.name} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span>{drug.name}</span>
        <span>{drug.volume} ml</span>
      </div>
    ))}

    <div style={{ marginTop: 10, fontWeight: "bold" }}>
      Total: {finalTotal} ml
    </div>

    <label style={{ marginTop: 10, display: "block" }}>
      Override Total (ml)
    </label>
    <input
      type="number"
      value={customTotal}
      onChange={(e) => setCustomTotal(e.target.value)}
      placeholder="Enter custom total"
      style={{ width: "100%", padding: 8, marginBottom: 10 }}
    />

    <button onClick={handleSave} style={{ marginTop: 10, padding: 10, width: "100%" }}>
      Save Record
    </button>
  </div>

  <div style={{ maxWidth: 500, margin: "20px auto" }}>
    <h2>Saved Patients</h2>

    <input
      placeholder="Search..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      style={{ width: "100%", padding: 8, marginBottom: 10 }}
    />

    {filteredRecords.map((rec, i) => (
      <div key={i} style={{ background: "white", padding: 10, marginBottom: 10 }}>
        <strong>{rec.patient}</strong> ({rec.ownerSurname}) - {rec.weight} kg
        <div style={{ fontSize: 12 }}>{rec.date}</div>

        {rec.doses.map((d, idx) => (
          <div key={idx}>{d.name}: {d.volume} ml</div>
        ))}

        <div style={{ fontWeight: "bold" }}>Total: {rec.total} ml</div>

        <button
          onClick={() => handleDelete(i)}
          style={{ marginTop: 8, background: "#d93025", color: "white", border: "none", padding: 6, cursor: "pointer" }}
        >
          Delete
        </button>
      </div>
    ))}
  </div>
</div>

); }
