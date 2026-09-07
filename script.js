// =========================================================
// SUPABASE CONFIGURATION
// =========================================================

const SUPABASE_URL = 'https://skbedgzcqwehxjunaocl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNrYmVkZ3pjcXdlaHhqdW5hb2NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg3NTQ1NzYsImV4cCI6MjEwNDMzMDU3Nn0.f2h_H_EppRgVLLvoOmu7T7KyAfmmgMs-WT5AXsasqWE';

const { createClient } = supabase;
const _supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// =========================================================
// FETCH PROJECTS FROM SUPABASE (DENGAN WARNA-WARNI KARTU)
// =========================================================

async function fetchMuseumProjects() {
    const projectContainer = document.getElementById('project-list-container');
    
    if (!projectContainer) return;

    try {
        const { data: projects, error } = await _supabase
            .from('projects')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;

        if (!projects || projects.length === 0) {
            projectContainer.innerHTML = `<p style="font-weight: 900; grid-column: 1 / -1; text-align: center;">Belum ada artefak/proyek museum yang ditambahkan.</p>`;
            return;
        }

        projectContainer.innerHTML = '';
        const isLoggedIn = localStorage.getItem('isAdminLoggedIn') === 'true';

        // Daftar kelas warna ala Neobrutalism (dipindah dari skills)
        const colorClasses = ['yellow', 'pink', 'blue', 'green', 'orange', 'white'];

        projects.forEach((project, index) => {
            const projectNumber = String(index + 1).padStart(2, '0');
            // Pilih warna secara bergiliran berdasarkan index
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

    } catch (err) {
        console.error('Gagal memuat proyek:', err.message);
        projectContainer.innerHTML = `<p style="font-weight: 900; grid-column: 1 / -1; text-align: center; color: #EF476F;">Gagal memuat data dari database museum.</p>`;
    }
}


// =========================================================
// AUTH CHECK & UI ADJUSTMENT
// =========================================================

function checkAdminSession() {
    const navButton = document.querySelector('.nav-button');
    const isLoggedIn = localStorage.getItem('isAdminLoggedIn');

    if (isLoggedIn === 'true') {
        if (navButton) {
            navButton.textContent = 'LOGOUT ADMIN';
            navButton.href = '#';
            navButton.addEventListener('click', async (e) => {
                e.preventDefault();
                localStorage.removeItem('isAdminLoggedIn');
                localStorage.removeItem('adminEmail');
                alert('Berhasil logout.');
                window.location.reload();
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
// FITUR TAMBAH PROYEK (BASE64)
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

                const fileInput = document.getElementById('proj-file');
                const file = fileInput ? fileInput.files[0] : null;

                if (!file) {
                    alert('Pilih file gambar terlebih dahulu!');
                    return;
                }

                const reader = new FileReader();
                reader.readAsDataURL(file);

                reader.onload = async function () {
                    const base64Image = reader.result;

                    try {
                        const newProject = {
                            title: document.getElementById('proj-title').value.trim(),
                            category: document.getElementById('proj-category').value.trim(),
                            description: document.getElementById('proj-desc').value.trim(),
                            technologies: document.getElementById('proj-tech').value.trim(),
                            image_url: base64Image,
                            project_url: document.getElementById('proj-url').value.trim() || '#'
                        };

                        const { error: insertError } = await _supabase
                            .from('projects')
                            .insert([newProject]);

                        if (insertError) throw insertError;

                        alert('Artefak museum berhasil ditambahkan!');
                        document.getElementById('add-project-modal').style.display = 'none';
                        addForm.reset();
                        fetchMuseumProjects();
                    } catch (err) {
                        console.error('Gagal menyimpan artefak:', err.message);
                        alert('Gagal menyimpan data ke database: ' + err.message);
                    }
                };
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

                const id = document.getElementById('edit-proj-id').value;
                const title = document.getElementById('edit-proj-title').value.trim();
                const category = document.getElementById('edit-proj-category').value.trim();
                const description = document.getElementById('edit-proj-desc').value.trim();
                const technologies = document.getElementById('edit-proj-tech').value.trim();
                const project_url = document.getElementById('edit-proj-url').value.trim() || '#';
                const fileInput = document.getElementById('edit-proj-file');
                const file = fileInput ? fileInput.files[0] : null;

                const updateData = { title, category, description, technologies, project_url };

                const executeUpdate = async (finalData) => {
                    try {
                        const { error } = await _supabase
                            .from('projects')
                            .update(finalData)
                            .eq('id', id);

                        if (error) throw error;

                        alert('Artefak berhasil diperbarui!');
                        document.getElementById('edit-project-modal').style.display = 'none';
                        fetchMuseumProjects();
                    } catch (err) {
                        console.error('Gagal memperbarui:', err.message);
                        alert('Gagal memperbarui artefak: ' + err.message);
                    }
                };

                if (file) {
                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = async function () {
                        updateData.image_url = reader.result;
                        await executeUpdate(updateData);
                    };
                } else {
                    await executeUpdate(updateData);
                }
            });
        }
    }
}


// =========================================================
// FUNGSI HAPUS DAN BUKA MODAL EDIT
// =========================================================

async function deleteProject(id) {
    if (!confirm('Apakah kamu yakin ingin menghapus artefak ini dari museum?')) return;

    try {
        const { error } = await _supabase
            .from('projects')
            .delete()
            .eq('id', id);

        if (error) throw error;

        alert('Artefak berhasil dihapus!');
        fetchMuseumProjects();
    } catch (err) {
        console.error('Gagal menghapus:', err.message);
        alert('Gagal menghapus artefak: ' + err.message);
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
        document.getElementById('edit-proj-category').value = data.category || '';
        document.getElementById('edit-proj-desc').value = data.description || '';
        document.getElementById('edit-proj-tech').value = data.technologies || '';
        document.getElementById('edit-proj-url').value = data.project_url || '';
        document.getElementById('edit-proj-file').value = '';

        document.getElementById('edit-project-modal').style.display = 'flex';
    } catch (err) {
        console.error('Gagal memuat data edit:', err.message);
        alert('Gagal mengambil data artefak untuk diedit.');
    }
}


// =========================================================
// INITIALIZE ON DOM LOAD
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    fetchMuseumProjects();
    checkAdminSession();
    setupAdminFeatures();
});