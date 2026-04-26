import { useState, useEffect } from "react";

const ALL_DRUGS = [
  { id: "med", name: "Medetomidine", calc: (w) => (0.2 * w) / 10 },
  { id: "ket", name: "Ketamine", calc: (w) => (3 * w) / 100 },
  { id: "but", name: "Butorphanol", calc: (w) => (0.1 * w) / 10 },
  { id: "acp", name: "ACP", calc: (w) => (0.06 * w) / 2 },
];

export default function App() {
  const [weight, setWeight] = useState("");
  const [patient, setPatient] = useState("");
  const [ownerSurname, setOwnerSurname] = useState("");
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState("");
  const [activeDrugs, setActiveDrugs] = useState(ALL_DRUGS.map(d => d.id));

  // per-drug manual override volumes
  const [overrides, setOverrides] = useState({});

  // stock tracking
  const [stock, setStock] = useState({});

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

  const toggleDrug = (id) => {
    setActiveDrugs(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const selectedDrugs = ALL_DRUGS.filter(d => activeDrugs.includes(d.id));

  const calculateDoses = () => {
    return selectedDrugs.map((drug) => {
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

  const handleStockChange = (id, field, value) => {
    setStock(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value,
      },
    }));
  };

  const handleSave = () => {
    if (!patient || !ownerSurname) return alert("Enter patient and owner surname");

    const doses = calculateDoses();

    // subtract from stock
    const updatedStock = { ...stock };

    doses.forEach(d => {
      const current = parseFloat(updatedStock[d.id]?.total || 0);
      const used = parseFloat(d.volume);

      if (!isNaN(current)) {
        const remaining = current - used;
        updatedStock[d.id] = {
          ...updatedStock[d.id],
          total: remaining.toFixed(2),
        };

        const initial = parseFloat(updatedStock[d.id]?.initial || current);
        if (initial > 0 && remaining / initial < 0.29) {
          alert(`${d.name} low: ${remaining.toFixed(2)} ml remaining`);
        }
      }
    });

    setStock(updatedStock);

    const newRecord = {
      patient,
      ownerSurname,
      weight,
      doses,
      date: new Date().toLocaleString(),
    };

    setRecords([newRecord, ...records]);
    setOverrides({});
  };

  const handleDelete = (index) => {
    const updated = records.filter((_, i) => i !== index);
    setRecords(updated);
  };

  const filteredRecords = records.filter(r =>
    `${r.patient} ${r.ownerSurname}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: 20, fontFamily: "Arial", background: "#f1f3f4" }}>

      <div style={{ maxWidth: 500, margin: "0 auto", background: "white", padding: 20, borderRadius: 10 }}>
        <h1>Sedation Calculator</h1>

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
          <div key={drug.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span>{drug.name}</span>
            <input
              type="number"
              value={drug.volume}
              onChange={(e) => handleOverride(drug.id, e.target.value)}
              style={{ width: 80 }}
            />
          </div>
        ))}

        <button onClick={handleSave} style={{ marginTop: 15, padding: 10, width: "100%" }}>
          Save Record
        </button>
      </div>

      {/* STOCK SECTION */}
      <div style={{ maxWidth: 500, margin: "20px auto", background: "white", padding: 20, borderRadius: 10 }}>
        <h2>Drug Stock</h2>
        {ALL_DRUGS.map(d => (
          <div key={d.id} style={{ marginBottom: 10 }}>
            <strong>{d.name}</strong>
            <input
              placeholder="Batch"
              value={stock[d.id]?.batch || ""}
              onChange={(e) => handleStockChange(d.id, "batch", e.target.value)}
              style={{ width: "100%", marginBottom: 5 }}
            />
            <input
              type="number"
              placeholder="Total ml"
              value={stock[d.id]?.total || ""}
              onChange={(e) => handleStockChange(d.id, "total", e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
        ))}
      </div>

      {/* RECORDS */}
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

            <button
              onClick={() => handleDelete(i)}
              style={{ marginTop: 8, background: "#d93025", color: "white", border: "none", padding: 6 }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
