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
    getDoc,
    getDocs,
    where
} from './firebase-config.js';

class DiaryManager {
    constructor() {
        this.entries = [];
        this.form = document.getElementById('diaryForm');
        this.entriesList = document.getElementById('entriesList');
        this.db = db;
        this.getDoc = getDoc;
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
        if (confirm('Yakin mau menghapus catatan ini?')) {
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
            const docRef = doc(this.db, 'entries', id);
            const docSnap = await this.getDoc(docRef);
            
            if (docSnap.exists()) {
                const entry = docSnap.data();
                document.getElementById('title').value = entry.title;
                document.getElementById('content').value = entry.content;
                document.getElementById('entryId').value = id;
            } else {
                console.log("Dokumen ga ditemukan!");
                alert('Data tidak ditemukan');
            }
        } catch (error) {
            console.error("Error editing entry:", error);
            alert('Gagal mengambil data untuk diedit');
        }
    }

    async addComment(entryId, event) {
        event.preventDefault();
        const form = event.target;
        const name = form.querySelector('#comment-name-' + entryId).value;
        const commentText = form.querySelector('#comment-text-' + entryId).value;

        if (!name || !commentText) {
            alert('Mohon isi nama samaran dan komentar lu!');
            return;
        }

        try {
            const commentData = {
                name,
                comment: commentText,
                timestamp: serverTimestamp(),
                entryId
            };

            await addDoc(collection(db, 'comments'), commentData);
            form.reset();
            
            // Reload komentar setelah menambah komentar baru
            this.loadComments(entryId).then(({comments, replies}) => {
                this.renderComments(entryId, comments, replies);
            });
        } catch (error) {
            console.error("Error adding comment:", error);
            alert('Gagal nambahin komentar lu');
        }
    }

    async loadComments(entryId) {
        try {
            const q = query(
                collection(db, 'comments'), 
                where('entryId', '==', entryId),
                orderBy('timestamp', 'desc')
            );
            
            const snapshot = await getDocs(q);
            const comments = [];
            const replies = {};

            snapshot.forEach((doc) => {
                const comment = { id: doc.id, ...doc.data() };
                if (comment.isReply) {
                    if (!replies[comment.parentCommentId]) {
                        replies[comment.parentCommentId] = [];
                    }
                    replies[comment.parentCommentId].push(comment);
                } else {
                    comments.push(comment);
                }
            });

            return { comments, replies };
        } catch (error) {
            console.error("Error loading comments:", error);
            return { comments: [], replies: {} };
        }
    }

    renderComments(entryId, comments, replies) {
        const commentsContainer = document.getElementById(`comments-${entryId}`);
        if (commentsContainer) {
            commentsContainer.innerHTML = comments.length ? comments.map(comment => `
                <div class="bg-slate-700/50 p-3 rounded-lg">
                    <div class="flex justify-between items-start">
                        <p class="text-sm font-semibold text-blue-300">${comment.name}</p>
                        <div class="flex items-center gap-2">
                            <p class="text-xs text-gray-400">
                                ${comment.timestamp ? new Date(comment.timestamp.toDate()).toLocaleDateString('id-ID') : ''}
                            </p>
                            <button onclick="diaryManager.deleteComment('${comment.id}')" 
                                    class="text-red-400 hover:text-red-300 transition-colors">
                                <i class="fas fa-trash-alt"></i>
                            </button>
                        </div>
                    </div>
                    <p class="text-sm text-gray-300 mt-2">${comment.comment}</p>
                    
                    <!-- Tombol Reply -->
                    <button onclick="diaryManager.showReplyForm('${entryId}', '${comment.id}', '${comment.name}')" 
                            class="text-xs text-blue-400 hover:text-blue-300 mt-2 transition-colors">
                        <i class="fas fa-reply mr-1"></i>Balas
                    </button>
                    
                    <!-- Form Reply -->
                    <div id="reply-form-${comment.id}" class="hidden mt-2 pl-4 border-l-2 border-slate-600">
                    </div>
                    
                    <!-- Daftar Reply -->
                    <div id="replies-${comment.id}" class="mt-2 pl-4 space-y-2">
                        ${replies[comment.id] ? replies[comment.id].map(reply => `
                            <div class="bg-slate-700/70 p-2 rounded-lg">
                                <div class="flex justify-between items-start">
                                    <p class="text-sm font-semibold text-blue-300">${reply.name}</p>
                                    <div class="flex items-center gap-2">
                                        <p class="text-xs text-gray-400">
                                            ${reply.timestamp ? new Date(reply.timestamp.toDate()).toLocaleDateString('id-ID') : ''}
                                        </p>
                                        <button onclick="diaryManager.deleteComment('${reply.id}')" 
                                                class="text-red-400 hover:text-red-300 transition-colors">
                                            <i class="fas fa-trash-alt"></i>
                                        </button>
                                    </div>
                                </div>
                                <p class="text-sm text-gray-300 mt-1">${reply.comment}</p>
                            </div>
                        `).join('') : ''}
                    </div>
                </div>
            `).join('') : '<p class="text-sm text-gray-500">Belum ada komentar</p>';
        }
    }

    renderEntries() {
        this.entriesList.innerHTML = this.entries.map((entry, index) => `
            <div class="bg-slate-800 rounded-lg p-6 hover:shadow-lg transition duration-300" 
                 style="animation: fadeInUp ${0.3 + index * 0.1}s ease-out;">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <h3 class="text-xl font-semibold text-blue-400">${entry.title}</h3>
                        <p class="text-gray-400 text-sm">${entry.date}${entry.edited ? ' (Diedit)' : ''}</p>
                    </div>
                    <div class="space-x-2">
                        <button onclick="diaryManager.editEntry('${entry.id}')" 
                                class="text-blue-400 hover:text-blue-300 transition-colors">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="diaryManager.deleteEntry('${entry.id}')" 
                                class="text-red-400 hover:text-red-300 transition-colors">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <p class="text-gray-300 whitespace-pre-wrap">${entry.content}</p>
                
                <!-- Tombol untuk membuka komentar -->
                <div class="mt-4 text-center">
                    <button onclick="diaryManager.toggleComments('${entry.id}')" 
                            class="text-blue-400 hover:text-blue-300 transition-colors text-sm">
                        <i class="fas fa-comments mr-2"></i>Lihat Komentar
                    </button>
                </div>

                <!-- Bagian Komentar (hidden by default) -->
                <div id="comments-section-${entry.id}" class="hidden mt-4 pt-4 border-t border-slate-700">
                    <h4 class="text-sm text-blue-400 mb-3">kasih komen?</h4>
                    
                    <!-- Form Komentar -->
                    <form onsubmit="diaryManager.addComment('${entry.id}', event)" class="mb-4">
                        <div class="flex gap-2">
                            <input type="text" 
                                   id="comment-name-${entry.id}" 
                                   placeholder="Nama samaran lu"
                                   class="flex-1 bg-slate-700/90 rounded p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400">
                            <button type="submit" 
                                    class="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-sm transition-colors">
                                <i class="fas fa-paper-plane"></i>
                            </button>
                        </div>
                        <textarea id="comment-text-${entry.id}" 
                                  placeholder="Tulis komentar lu..."
                                  rows="2"
                                  class="w-full mt-2 bg-slate-700/90 rounded p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"></textarea>
                    </form>

                    <!-- Daftar Komentar -->
                    <div id="comments-${entry.id}" class="space-y-2">
                        <!-- Komentar akan dimuat secara dinamis -->
                    </div>
                </div>
            </div>
        `).join('');

        // Load komentar untuk setiap entri
        this.entries.forEach(entry => {
            this.loadComments(entry.id).then(({comments, replies}) => {
                this.renderComments(entry.id, comments, replies);
            });
        });
    }

    // Tambahkan method baru untuk toggle comments
    toggleComments(entryId) {
        const commentsSection = document.getElementById(`comments-section-${entryId}`);
        const button = commentsSection.previousElementSibling.querySelector('button');
        
        if (commentsSection.classList.contains('hidden')) {
            commentsSection.classList.remove('hidden');
            button.innerHTML = '<i class="fas fa-times mr-2"></i>Tutup Komentar';
        } else {
            commentsSection.classList.add('hidden');
            button.innerHTML = '<i class="fas fa-comments mr-2"></i>Lihat Komentar';
        }
    }

    // Method untuk menampilkan form reply
    async showReplyForm(entryId, commentId, replyTo) {
        const replyFormContainer = document.getElementById(`reply-form-${commentId}`);
        
        if (replyFormContainer.classList.contains('hidden')) {
            replyFormContainer.classList.remove('hidden');
            replyFormContainer.innerHTML = `
                <form onsubmit="diaryManager.addReply('${entryId}', '${commentId}', event)" class="space-y-2">
                    <input type="text" 
                           id="reply-name-${commentId}" 
                           placeholder="Nama samaran lu"
                           class="w-full bg-slate-700/90 rounded p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400">
                    <textarea id="reply-text-${commentId}" 
                              placeholder="Balas ke @${replyTo}..."
                              rows="2"
                              class="w-full bg-slate-700/90 rounded p-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-400 placeholder-gray-400"></textarea>
                    <button type="submit" 
                            class="bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded text-sm transition-colors w-full">
                        Kirim Balasan
                    </button>
                </form>
            `;
        } else {
            replyFormContainer.classList.add('hidden');
            replyFormContainer.innerHTML = '';
        }
    }

    // Method untuk menambah reply
    async addReply(entryId, commentId, event) {
        event.preventDefault();
        const form = event.target;
        const name = form.querySelector(`#reply-name-${commentId}`).value;
        const replyText = form.querySelector(`#reply-text-${commentId}`).value;

        if (!name || !replyText) {
            alert('Mohon isi nama samaran dan balasan lu!');
            return;
        }

        try {
            const replyData = {
                name,
                comment: replyText,
                timestamp: serverTimestamp(),
                entryId,
                parentCommentId: commentId,
                isReply: true
            };

            await addDoc(collection(db, 'comments'), replyData);
            form.reset();
            document.getElementById(`reply-form-${commentId}`).classList.add('hidden');
        } catch (error) {
            console.error("Error adding reply:", error);
            alert('Gagal nambahin balasan lu');
        }
    }

    async deleteComment(commentId) {
        if (confirm('Yakin mau menghapus komentar ini?')) {
            try {
                await deleteDoc(doc(db, 'comments', commentId));
                // Komentar akan diupdate otomatis karena menggunakan onSnapshot
            } catch (error) {
                console.error("Error deleting comment:", error);
                alert('Gagal menghapus komentar');
            }
        }
    }
}

const diaryManager = new DiaryManager();
window.diaryManager = diaryManager;

document.addEventListener('DOMContentLoaded', () => {
    console.log("DOM Content Loaded");
    const textElement = document.getElementById('animated-text');
    console.log("Text Element:", textElement);

    if (!textElement) {
        console.error("Animated text element not found!");
        return;
    }

    const texts = [
        "tempat wira ardhinata menulis dan ngobrol ٩( ╹▿╹ )۶ !!",
        "kasih kritik atau saran tentang wira (─ ‿ ─) !",
        "di larang berkata kasar (◣ _ ◢) !!!"
    ];
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let delay = 200;

    function type() {
        console.log("Typing...", textIndex, charIndex);
        const currentText = texts[textIndex];
        if (isDeleting) {
            charIndex--;
            textElement.textContent = currentText.substring(0, charIndex);
            delay = 100;
        } else {
            charIndex++;
            textElement.textContent = currentText.substring(0, charIndex);
            delay = 200;
        }

        if (!isDeleting && charIndex === currentText.length) {
            delay = 2000; // Pause at the end of the text
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            delay = 500; // Pause before typing the next text
        }

        setTimeout(type, delay);
    }

    type();
});