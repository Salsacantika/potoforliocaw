// =========================================================
// SUPABASE CONFIGURATION
// =========================================================

const SUPABASE_URL = 'https://skbedgzcqwehxjunaocl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYmVkZ3pjcXdlaHhqdW5hb2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTQ1NzYsImV4cCI6MjEwNDMzMDU3Nn0.f2h_H_EppRgVLLvoOmu7T7KyAfmmgMs-WT5AXsasqWE';

let _supabase = null;
try {
    const { createClient } = supabase;
    _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} catch (err) {
    console.error('Supabase gagal dimuat, fitur database dinonaktifkan:', err.message);
}


// =========================================================
// STATE GLOBAL: SEMUA PROYEK & FILTER AKTIF
// =========================================================

let allMuseumProjects = [];
let activeCategoryFilter = 'SEMUA';


// =========================================================
// CUSTOM ALERT CARD (PENGGANTI ALERT() BAWAAN BROWSER)
// =========================================================

function showNotification(message, title = 'INFORMASI') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-notification-modal');
        const titleEl = document.getElementById('notif-title');
        const msgEl = document.getElementById('notif-message');
        const closeBtn = document.getElementById('notif-close-btn');

        if (!modal) {
            alert(message);
            resolve();
            return;
        }

        // Buat atau pastikan tombol batal ada untuk modal interaktif konfirmasi (dua tombol)
        let cancelBtn = document.getElementById('notif-cancel-btn');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.id = 'notif-cancel-btn';
            cancelBtn.style.cssText = `
                background: #FF6B6B; 
                color: #FFF; 
                border: 3px solid #111; 
                padding: 12px 20px; 
                font-weight: 900; 
                cursor: pointer; 
                box-shadow: 4px 4px 0 #111; 
                width: 100%;
                margin-top: 10px;
                display: none;
            `;
            closeBtn.parentNode.appendChild(cancelBtn);
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
        closeBtn.textContent = 'OK';
        cancelBtn.style.display = 'none'; // Sembunyikan secara default untuk alert biasa
        modal.style.display = 'flex';

        closeBtn.onclick = function() {
            cancelBtn.style.display = 'none';
            modal.style.display = 'none';
            resolve(true); // true untuk OK/Ya
        };
    });
}

// Fungsi khusus untuk menampilkan konfirmasi dengan pilihan OK / TIDAK
function showConfirmModal(message, title = 'KONFIRMASI') {
    return new Promise((resolve) => {
        const modal = document.getElementById('custom-notification-modal');
        const titleEl = document.getElementById('notif-title');
        const msgEl = document.getElementById('notif-message');
        const okBtn = document.getElementById('notif-close-btn');

        if (!modal) {
            resolve(confirm(message));
            return;
        }

        // Cari atau buat tombol "TIDAK"
        let cancelBtn = document.getElementById('notif-cancel-btn');
        if (!cancelBtn) {
            cancelBtn = document.createElement('button');
            cancelBtn.id = 'notif-cancel-btn';
            cancelBtn.style.cssText = `
                background: #FF6B6B; 
                color: #FFF; 
                border: 3px solid #111; 
                padding: 12px 20px; 
                font-weight: 900; 
                cursor: pointer; 
                box-shadow: 4px 4px 0 #111; 
                width: 100%;
                margin-top: 10px;
            `;
            okBtn.parentNode.appendChild(cancelBtn);
        } else {
            cancelBtn.style.display = 'block';
        }

        titleEl.textContent = title;
        msgEl.textContent = message;
        okBtn.textContent = 'OK';
        cancelBtn.textContent = 'TIDAK';
        modal.style.display = 'flex';

        // Handler klik OK
        okBtn.onclick = function() {
            cancelBtn.style.display = 'none';
            modal.style.display = 'none';
            resolve(true);
        };

        // Handler klik TIDAK
        cancelBtn.onclick = function() {
            cancelBtn.style.display = 'none';
            modal.style.display = 'none';
            resolve(false);
        };
    });
}


// =========================================================
// FETCH PROJECTS FROM SUPABASE
// =========================================================

async function fetchMuseumProjects() {
    const projectContainer = document.getElementById('project-list-container');
    
    if (!projectContainer) return;

    if (!_supabase) {
        projectContainer.innerHTML = `<p style="font-weight: 900; grid-column: 1 / -1; text-align: center; color: #EF476F;">Koneksi database tidak tersedia. Cek koneksi internet lalu refresh halaman.</p>`;
        return;
    }

    try {
        const { data: projects, error } = await _supabase
            .from('projects')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        allMuseumProjects = projects || [];
        renderFilterBar();
        renderProjectGrid();

    } catch (err) {
        console.error('Gagal memuat proyek:', err.message);
        projectContainer.innerHTML = `<p style="font-weight: 900; grid-column: 1 / -1; text-align: center; color: #EF476F;">Gagal memuat data dari database museum.</p>`;
    }
}


// =========================================================
// RENDER FILTER BAR KATEGORI
// =========================================================

function renderFilterBar() {
    const filterBar = document.getElementById('filter-bar');
    if (!filterBar) return;

    const categories = allMuseumProjects
        .map(p => (p.category || 'MUSEUM EXHIBIT').trim().toUpperCase())
        .filter(Boolean);
    const uniqueCategories = ['SEMUA', ...new Set(categories)];

    filterBar.innerHTML = uniqueCategories.map(cat => `
        <button type="button" class="filter-btn ${cat === activeCategoryFilter ? 'active' : ''}" data-category="${cat}">
            ${cat}
        </button>
    `).join('');

    filterBar.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            activeCategoryFilter = btn.dataset.category;
            renderFilterBar();
            renderProjectGrid();
        });
    });
}


// =========================================================
// RENDER GRID PROYEK
// =========================================================

function renderProjectGrid() {
    const projectContainer = document.getElementById('project-list-container');
    if (!projectContainer) return;

    const filteredProjects = activeCategoryFilter === 'SEMUA'
        ? allMuseumProjects
        : allMuseumProjects.filter(p => (p.category || 'MUSEUM EXHIBIT').trim().toUpperCase() === activeCategoryFilter);

    if (!allMuseumProjects || allMuseumProjects.length === 0) {
        projectContainer.innerHTML = `<p style="font-weight: 900; grid-column: 1 / -1; text-align: center;">Belum ada artefak/proyek museum yang ditambahkan.</p>`;
        return;
    }

    if (filteredProjects.length === 0) {
        projectContainer.innerHTML = `<p style="font-weight: 900; grid-column: 1 / -1; text-align: center;">Tidak ada artefak pada kategori ini.</p>`;
        return;
    }

    projectContainer.innerHTML = '';
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';

    const colorClasses = ['yellow', 'pink', 'blue', 'green', 'orange', 'white'];

    {
        const projects = filteredProjects;
        projects.forEach((project, index) => {
            const projectNumber = String(index + 1).padStart(2, '0');
            const randomColorClass = colorClasses[index % colorClasses.length];
            
            let techHTML = '';
            if (project.technologies) {
                const techArray = Array.isArray(project.technologies) 
                    ? project.technologies 
                    : project.technologies.split(',');
                
                techHTML = techArray.map(tech => `<span>${tech.trim()}</span>`).join('');
            }

            let adminActionHTML = '';
            if (isLoggedIn) {
                adminActionHTML = `
                    <div style="display: flex; gap: 10px; margin-top: 15px; border-top: 2px dashed #111; padding-top: 12px;">
                        <button onclick="openEditModal(${project.id})" style="flex: 1; background: #111; color: #FFF; border: 2px solid #111; font-weight: 900; padding: 6px; cursor: pointer; box-shadow: 2px 2px 0 #111;">EDIT</button>
                        <button onclick="deleteProject(${project.id})" style="flex: 1; background: #EF476F; color: white; border: 2px solid #111; font-weight: 900; padding: 6px; cursor: pointer; box-shadow: 2px 2px 0 #111;">HAPUS</button>
                    </div>
                `;
            }

            const cardHTML = `
                <div class="project-card ${randomColorClass}" id="project-card-${project.id}">
                    <div class="project-image">
                        <span class="project-number">ART. ${projectNumber}</span>
                        <img src="${project.image_url || 'https://via.placeholder.com/400x250?text=No+Image'}" alt="${project.title}">
                    </div>
                    <div class="project-info">
                        <div>
                            <span>${project.category || 'MUSEUM EXHIBIT'}</span>
                            <h3>${project.title}</h3>
                            <p>${project.description}</p>
                        </div>
                        <div>
                            <div class="tech" style="margin-bottom: 12px;">
                                ${techHTML}
                            </div>
                            ${project.project_url ? `<a href="${project.project_url}" target="_blank" class="project-link">LIHAT ARTEFAK &rarr;</a>` : ''}
                            ${adminActionHTML}
                        </div>
                    </div>
                </div>
            `;

            projectContainer.innerHTML += cardHTML;
        });
    }

    projectContainer.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', (e) => {
            if (e.target.closest('a, button')) return;
            const id = card.id.replace('project-card-', '');
            openProjectDetailModal(id);
        });
    });
}


// =========================================================
// MODAL DETAIL PROYEK (PUBLIK)
// =========================================================

function openProjectDetailModal(id) {
    const project = allMuseumProjects.find(p => String(p.id) === String(id));
    if (!project) return;

    let techHTML = '';
    if (project.technologies) {
        const techArray = Array.isArray(project.technologies)
            ? project.technologies
            : project.technologies.split(',');
        techHTML = techArray.map(tech => `<span>${tech.trim()}</span>`).join('');
    }

    const modalBody = document.getElementById('detail-modal-body');
    modalBody.innerHTML = `
        <img src="${project.image_url || 'https://via.placeholder.com/600x300?text=No+Image'}" alt="${project.title}" class="detail-modal-img">
        <span class="detail-modal-cat">${project.category || 'MUSEUM EXHIBIT'}</span>
        <h3>${project.title}</h3>
        <p class="detail-desc">${project.description}</p>
        <div class="tech">${techHTML}</div>
        ${project.project_url && project.project_url !== '#' ? `<a href="${project.project_url}" target="_blank" class="project-link">LIHAT ARTEFAK &rarr;</a>` : ''}
    `;

    document.getElementById('detail-project-modal').classList.add('open');
}

function closeProjectDetailModal() {
    document.getElementById('detail-project-modal').classList.remove('open');
}


// =========================================================
// AUTH CHECK & UI ADJUSTMENT (LOGOUT DENGAN PILIHAN OK / TIDAK)
// =========================================================

function checkAdminSession() {
    const navButton = document.querySelector('.nav-button');
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');

    if (isLoggedIn === 'true') {
        if (navButton) {
            navButton.textContent = 'LOGOUT ADMIN';
            navButton.href = '#';
            
            // Ganti elemen agar event listener bersih dari duplikasi
            const newNavButton = navButton.cloneNode(true);
            navButton.parentNode.replaceChild(newNavButton, navButton);

            newNavButton.addEventListener('click', async (e) => {
                e.preventDefault();

                // Panggil card konfirmasi dengan opsi OK / TIDAK
                const shouldLogout = await showConfirmModal('Yakin mau logout?', 'KONFIRMASI');

                if (shouldLogout) {
                    localStorage.removeItem('isAdminLoggedIn');
                    localStorage.removeItem('adminEmail');
                    window.location.reload();
                }
            });
        }
    } else {
        if (navButton) {
            navButton.textContent = 'LOGIN ADMIN';
            navButton.href = 'login.html';
        }
    }
}


// =========================================================
// HELPER: UPLOAD GAMBAR KE SUPABASE STORAGE
// =========================================================

const STORAGE_BUCKET = 'projects-images';

async function uploadProjectImage(file) {
    if (!_supabase) throw new Error('Koneksi database tidak tersedia.');

    const fileExt = file.name.split('.').pop().toLowerCase();
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${fileExt}`;

    const { error: uploadError } = await _supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, { cacheControl: '3600', upsert: false });

    if (uploadError) {
        throw new Error(`Gagal upload gambar ke storage: ${uploadError.message}`);
    }

    const { data } = _supabase.storage.from(STORAGE_BUCKET).getPublicUrl(fileName);

    if (!data || !data.publicUrl) {
        throw new Error('Gagal mendapatkan URL publik gambar.');
    }

    return data.publicUrl;
}


// =========================================================
// FITUR ADMIN (TAMBAH & EDIT PROYEK)
// =========================================================

function setupAdminFeatures() {
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');
    const projectsSection = document.querySelector('.section.projects .section-title');

    if (isLoggedIn === 'true' && projectsSection) {
        const addBtn = document.createElement('button');
        addBtn.textContent = '+ TAMBAH PROYEK BARU';
        addBtn.style.cssText = `
            margin-top: 15px;
            background: #FFD166;
            color: #111;
            border: 3px solid #111;
            padding: 10px 16px;
            font-weight: 900;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 4px 4px 0 #111;
        `;
        
        addBtn.addEventListener('click', () => {
            document.getElementById('add-project-modal').style.display = 'flex';
        });

        projectsSection.appendChild(addBtn);

        const closeModalBtn = document.getElementById('close-modal-btn');
        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                document.getElementById('add-project-modal').style.display = 'none';
            });
        }

        const addForm = document.getElementById('add-project-form');
        if (addForm) {
            addForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitBtn = addForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn ? submitBtn.textContent : '';

                const fileInput = document.getElementById('proj-file');
                const file = fileInput ? fileInput.files[0] : null;
                const category = document.getElementById('proj-category').value.trim();

                if (!file) {
                    await showNotification('Pilih file gambar terlebih dahulu!', 'PERHATIAN');
                    return;
                }

                if (!category) {
                    await showNotification('Pilih kategori terlebih dahulu!', 'PERHATIAN');
                    return;
                }

                if (!_supabase) {
                    await showNotification('Koneksi database tidak tersedia. Cek koneksi internet lalu refresh halaman.', 'GAGAL');
                    return;
                }

                try {
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'MENYIMPAN...';
                    }

                    const imageUrl = await uploadProjectImage(file);

                    const newProject = {
                        title: document.getElementById('proj-title').value.trim(),
                        category: category,
                        description: document.getElementById('proj-desc').value.trim(),
                        technologies: document.getElementById('proj-tech').value.trim(),
                        image_url: imageUrl,
                        project_url: document.getElementById('proj-url').value.trim() || '#'
                    };

                    const { error: insertError } = await _supabase
                        .from('projects')
                        .insert([newProject]);

                    if (insertError) throw insertError;

                    await showNotification('Artefak museum berhasil ditambahkan!', 'BERHASIL');
                    document.getElementById('add-project-modal').style.display = 'none';
                    addForm.reset();
                    fetchMuseumProjects();
                } catch (err) {
                    console.error('Gagal menyimpan artefak:', err);
                    await showNotification('Gagal menyimpan data ke database: ' + (err.message || 'Terjadi kesalahan tidak diketahui.'), 'GAGAL');
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }
                }
            });
        }

        const closeEditModalBtn = document.getElementById('close-edit-modal-btn');
        if (closeEditModalBtn) {
            closeEditModalBtn.addEventListener('click', () => {
                document.getElementById('edit-project-modal').style.display = 'none';
            });
        }

        const editForm = document.getElementById('edit-project-form');
        if (editForm) {
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();

                const submitBtn = editForm.querySelector('button[type="submit"]');
                const originalBtnText = submitBtn ? submitBtn.textContent : '';

                const id = document.getElementById('edit-proj-id').value;
                const title = document.getElementById('edit-proj-title').value.trim();
                const category = document.getElementById('edit-proj-category').value.trim();
                const description = document.getElementById('edit-proj-desc').value.trim();
                const technologies = document.getElementById('edit-proj-tech').value.trim();
                const project_url = document.getElementById('edit-proj-url').value.trim() || '#';
                const fileInput = document.getElementById('edit-proj-file');
                const file = fileInput ? fileInput.files[0] : null;

                if (!category) {
                    await showNotification('Pilih kategori terlebih dahulu!', 'PERHATIAN');
                    return;
                }

                if (!_supabase) {
                    await showNotification('Koneksi database tidak tersedia. Cek koneksi internet lalu refresh halaman.', 'GAGAL');
                    return;
                }

                const updateData = { title, category, description, technologies, project_url };

                try {
                    if (submitBtn) {
                        submitBtn.disabled = true;
                        submitBtn.textContent = 'MENYIMPAN...';
                    }

                    if (file) {
                        updateData.image_url = await uploadProjectImage(file);
                    }

                    const { error } = await _supabase
                        .from('projects')
                        .update(updateData)
                        .eq('id', id);

                    if (error) throw error;

                    await showNotification('Artefak berhasil diperbarui!', 'BERHASIL');
                    document.getElementById('edit-project-modal').style.display = 'none';
                    fetchMuseumProjects();
                } catch (err) {
                    console.error('Gagal memperbarui:', err);
                    await showNotification('Gagal memperbarui artefak: ' + (err.message || 'Terjadi kesalahan tidak diketahui.'), 'GAGAL');
                } finally {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = originalBtnText;
                    }
                }
            });
        }
    }
}


// =========================================================
// FUNGSI HAPUS DAN BUKA MODAL EDIT
// =========================================================

async function deleteProject(id) {
    const konfirmasi = await showConfirmModal('Apakah kamu yakin ingin menghapus artefak ini dari museum?', 'KONFIRMASI HAPUS');
    if (!konfirmasi) return;

    try {
        const { error } = await _supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;

        await showNotification('Artefak berhasil dihapus!', 'BERHASIL');
        fetchMuseumProjects();
    } catch (err) {
        console.error('Gagal menghapus:', err.message);
        await showNotification('Gagal menghapus artefak: ' + err.message, 'GAGAL');
    }
}

async function openEditModal(id) {
    try {
        const { data, error } = await _supabase
            .from('projects')
            .select('*')
            .eq('id', id)
            .single();

        if (error) throw error;

        document.getElementById('edit-proj-id').value = data.id;
        document.getElementById('edit-proj-title').value = data.title || '';
        document.getElementById('edit-proj-category').value = (data.category || '').trim().toUpperCase();
        document.getElementById('edit-proj-desc').value = data.description || '';
        document.getElementById('edit-proj-tech').value = data.technologies || '';
        document.getElementById('edit-proj-url').value = data.project_url || '';
        document.getElementById('edit-proj-file').value = '';

        document.getElementById('edit-project-modal').style.display = 'flex';
    } catch (err) {
        console.error('Gagal memuat data edit:', err.message);
        await showNotification('Gagal mengambil data artefak untuk diedit.', 'GAGAL');
    }
}


// =========================================================
// MOBILE MENU TOGGLE
// =========================================================

function setupMobileMenu() {
    const toggleBtn = document.getElementById('mobile-menu-toggle');
    const overlay = document.getElementById('mobile-nav-overlay');
    if (!toggleBtn || !overlay) return;

    toggleBtn.addEventListener('click', () => {
        const isOpen = overlay.classList.toggle('open');
        toggleBtn.textContent = isOpen ? '✕' : '☰';
        toggleBtn.setAttribute('aria-label', isOpen ? 'Tutup menu navigasi' : 'Buka menu navigasi');
    });

    overlay.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            overlay.classList.remove('open');
            toggleBtn.textContent = '☰';
            toggleBtn.setAttribute('aria-label', 'Buka menu navigasi');
        });
    });
}


// =========================================================
// DARK MODE TOGGLE
// =========================================================

function setupDarkMode() {
    const toggleBtn = document.getElementById('dark-mode-toggle');
    if (!toggleBtn) return;

    const savedTheme = localStorage.getItem('museumTheme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        toggleBtn.textContent = '☀️';
    } else {
        toggleBtn.textContent = '🌙';
    }

    toggleBtn.addEventListener('click', () => {
        const isDark = document.body.classList.toggle('dark-mode');
        toggleBtn.textContent = isDark ? '☀️' : '🌙';
        localStorage.setItem('museumTheme', isDark ? 'dark' : 'light');
    });
}

function setupDetailModalClose() {
    const closeBtn = document.getElementById('close-detail-modal-btn');
    const overlay = document.getElementById('detail-project-modal');

    if (closeBtn) {
        closeBtn.addEventListener('click', closeProjectDetailModal);
    }
    if (overlay) {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) closeProjectDetailModal();
        });
    }
}

document.addEventListener("DOMContentLoaded", function() {
    const termWindow = document.querySelector('.terminal-window');
    const termInput = document.getElementById('terminal-input');
    const termContent = document.getElementById('terminal-content');

    if (!termWindow || !termInput || !termContent) return;

    termWindow.addEventListener('click', function() {
        termInput.focus();
    });

    termInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const command = termInput.value.trim();
            const lowerCommand = command.toLowerCase();
            
            if (command === '') return;

            const echoLine = document.createElement('div');
            echoLine.className = 'terminal-line';
            echoLine.innerHTML = `<span class="t-user">visitor@museum:~$</span> ${escapeHTML(command)}`;
            termContent.appendChild(echoLine);

            const responseLine = document.createElement('div');
            responseLine.className = 'terminal-line t-output';

            switch(lowerCommand) {
                case 'help':
                    responseLine.innerHTML = `
                        Perintah yang tersedia:<br>
                        - <span style="color:#6366F1">about</span> : Penjelasan mengenai museum ini.<br>
                        - <span style="color:#6366F1">skills</span> : Daftar teknologi terkurasi.<br>
                        - <span style="color:#6366F1">clear</span>  : Membersihkan layar terminal.
                    `;
                    break;
                case 'about':
                    responseLine.innerHTML = "Museum ini dirancang untuk mengubah ide liar menjadi kode nyata dengan estetika berani.";
                    break;
                case 'skills':
                    responseLine.innerHTML = "Daftar Artefak: HTML, CSS, JavaScript, Tailwind, Node.js, React, Supabase.";
                    break;
                case 'clear':
                    termContent.innerHTML = '';
                    termInput.value = '';
                    return;
                default:
                    responseLine.innerHTML = `Perintah <span style="color:#EF4444">'${escapeHTML(command)}'</span> tidak ditemukan. Ketik 'help' untuk bantuan.`;
            }

            termContent.appendChild(responseLine);
            termInput.value = '';
            
            termWindow.scrollTop = termWindow.scrollHeight;
        }
    });
});

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// =========================================================
// INITIALIZE ON DOM LOAD
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    fetchMuseumProjects();
    checkAdminSession();
    setupAdminFeatures();
    setupDarkMode();
    setupDetailModalClose();
    setupMobileMenu();
});
