import {
    db,
    collection,
    addDoc,
    deleteDoc,
    doc,
    updateDoc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    getDoc
} from './firebase-config.js';

class DiaryManager {
    constructor() {
        this.entries = [];
        this.form = document.getElementById('diaryForm');
        this.entriesList = document.getElementById('entriesList');
        this.setupEventListeners();
        this.loadEntries();
    }

    setupEventListeners() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });
    }

    async loadEntries() {
        try {
            const q = query(collection(db, 'entries'), orderBy('timestamp', 'desc'));
            onSnapshot(q, (snapshot) => {
                this.entries = [];
                snapshot.forEach((doc) => {
                    this.entries.push({ id: doc.id, ...doc.data() });
                });
                this.renderEntries();
            });
        } catch (error) {
            console.error("Error loading entries:", error);
            alert('Gagal memuat data');
        }
    }

    async handleSubmit() {
        const titleInput = document.getElementById('title');
        const contentInput = document.getElementById('content');
        const entryId = document.getElementById('entryId').value;

        if (!titleInput.value || !contentInput.value) {
            alert('Mohon isi semua field!');
            return;
        }

        try {
            if (entryId) {
                // Update existing entry
                await updateDoc(doc(db, 'entries', entryId), {
                    title: titleInput.value,
                    content: contentInput.value,
                    edited: true,
                    lastEditedAt: serverTimestamp()
                });
            } else {
                // Create new entry
                await addDoc(collection(db, 'entries'), {
                    title: titleInput.value,
                    content: contentInput.value,
                    timestamp: serverTimestamp(),
                    date: new Date().toLocaleDateString('id-ID')
                });
            }

            this.form.reset();
            document.getElementById('entryId').value = '';
        } catch (error) {
            console.error("Error saving entry:", error);
            alert('Gagal menyimpan data');
        }
    }

    async deleteEntry(id) {
        if (confirm('Yakin ingin menghapus catatan ini?')) {
            try {
                await deleteDoc(doc(db, 'entries', id));
            } catch (error) {
                console.error("Error deleting entry:", error);
                alert('Gagal menghapus data');
            }
        }
    }

    async editEntry(id) {
        try {
            const docRef = doc(db, 'entries', id);
            const docSnap = await getDoc(docRef);
            
            if (docSnap.exists()) {
                const entry = docSnap.data();
                document.getElementById('title').value = entry.title;
                document.getElementById('content').value = entry.content;
                document.getElementById('entryId').value = id;
            }
        } catch (error) {
            console.error("Error editing entry:", error);
            alert('Gagal mengambil data untuk diedit');
        }
    }

    renderEntries() {
        this.entriesList.innerHTML = this.entries.map(entry => `
            <div class="bg-slate-800 rounded-lg p-6 hover:shadow-lg transition duration-300">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-semibold text-blue-400">${entry.title}</h3>
                        <p class="text-gray-400 text-sm">${entry.date}${entry.edited ? ' (Diedit)' : ''}</p>
                    </div>
                    <div class="space-x-2">
                        <button onclick="diaryManager.editEntry('${entry.id}')" class="text-blue-400 hover:text-blue-300">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="diaryManager.deleteEntry('${entry.id}')" class="text-red-400 hover:text-red-300">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-gray-300 whitespace-pre-wrap">${entry.content}</p>
            </div>
        `).join('');
    }
}

const diaryManager = new DiaryManager();
window.diaryManager = diaryManager;