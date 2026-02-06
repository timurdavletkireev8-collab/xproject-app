import { useEffect, useState } from "react";
import { db } from "../../services/firebaseService";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";

export default function Admin() {
  const [pendingTasks, setPendingTasks] = useState([]);

  useEffect(() => {
    loadPending();
  }, []);

  async function loadPending() {
    const snap = await getDocs(collection(db, "tasks"));
    setPendingTasks(snap.docs.filter(d => d.data().status === "pending").map(d => ({ id: d.id, ...d.data() })));
  }

  async function approve(id) {
    await updateDoc(doc(db, "tasks", id), { status: "done" });
    loadPending();
  }

  return (
    <div className="section">
      <div className="admin-section">
        <div className="admin-title">Задания на проверке</div>
        {pendingTasks.map(t => (
          <div key={t.id} className="admin-item">
            <div className="admin-item-info">{t.name}</div>
            <button className="btn-approve" onClick={() => approve(t.id)}>✅ Одобрить</button>
          </div>
        ))}
      </div>
    </div>
  );
}
