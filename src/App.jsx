const handleSave = () => {
  const doses = calculateDoses();
  const updatedStock = { ...stock };
  const lockedMeta = {};

  doses
    .filter(d => activeDrugs.includes(d.id))
    .forEach(d => {
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
    doses: doses.filter(d => activeDrugs.includes(d.id)), // 👈 important
    meta: lockedMeta,
    date: new Date().toLocaleString(),
  };

  setRecords([newRecord, ...records]);

  setOverrides({});
  setWeight("");
  setPatient("");
  setOwnerSurname("");
};
