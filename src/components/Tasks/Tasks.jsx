import { useEffect, useState } from "react";
import { db } from "../../services/firebaseService";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "firebase/firestore";

export default function Tasks() {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    loadTasks();
  }, []);

  async function loadTasks() {
    const snapshot = await getDocs(collection(db, "tasks"));
    setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  }

  async function completeTask(taskId) {
    await updateDoc(doc(db, "tasks", taskId), { status: "pending" });
    loadTasks();
  }

  return (
    <div className="section">
      <div className="balance-card">
        <div className="balance-title">💰 Ваш баланс</div>
        <div className="balance-amount">0 X</div>
        <div className="balance-rub">≈ 0.00 ₽</div>
      </div>

      <div className="tasks-list">
        {tasks.map(task => (
          <div key={task.id} className="task-card">
            <div className="task-header">
              <img
                src={task.imageUrl || "https://via.placeholder.com/400x200"}
                alt="Task"
                className="task-image"
              />
              <div className="task-price">{task.price} X</div>
            </div>
            <div className="task-content">
              <div className="task-title">{task.name}</div>
              <div className="task-description">{task.description}</div>
              {task.status === "new" && (
                <button onClick={() => completeTask(task.id)}>Выполнить</button>
              )}
              {task.status === "pending" && <span className="status-pending">На проверке</span>}
              {task.status === "done" && <span className="status-completed">Выполнено</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
