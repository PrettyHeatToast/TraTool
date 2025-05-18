// =====================
// Studietraject Planner Script
// =====================
// This script dynamically loads curriculum data, manages drag-and-drop for courses (vakken), and updates study point counters and UI messages.

// Wait for the DOM to be fully loaded
document.addEventListener("DOMContentLoaded", () => {
    fetch('./curriculum.json')
        .then(response => response.json())
        .then(data => {
            // --- HEADER ---
            // Dynamically load the name of the opleiding (program)
            const header = document.querySelector('header p');
            header.textContent = `${data.opleiding.onderwijsinstelling} - ${data.opleiding.naam}`;

            // --- SIDEBAR (Op te nemen vakken) ---
            const sidebarDropzone = document.getElementById('sidebarDropzone');
            // Elements for study point counters
            const behaaldeSpElement = document.getElementById('behaaldeSp');
            const huidigTrajectSpElement = document.getElementById('huidigTrajectSp');
            const nogOpTeNemenSpElement = document.getElementById('nogOpTeNemenSp');
            const totaleSpElement = document.getElementById('totaleSp');

            // Clear sidebar before loading new courses
            sidebarDropzone.innerHTML = '';

            // --- STUDY POINTS CALCULATION ---
            // Updates the counters for study points in the sidebar
            const updateStudyPoints = () => {
                let behaaldeSp = 0; // Points for completed courses
                let huidigTrajectSp = 0; // Points for current trajectory
                let nogOpTeNemenSp = 0; // Points for courses not yet taken

                // Calculate completed study points (checked checkboxes in sidebar)
                sidebarDropzone.querySelectorAll('.checkbox:checked').forEach(checkbox => {
                    const courseCard = checkbox.closest('div');
                    const details = courseCard.querySelector('.details').textContent;
                    const studiepunten = parseInt(details.split(' ')[0]);
                    behaaldeSp += studiepunten;
                });

                // Calculate study points in current trajectory (courses in timeline dropzones)
                document.querySelectorAll('.dropzone > div').forEach(courseCard => {
                    const details = courseCard.querySelector('.details').textContent;
                    const studiepunten = parseInt(details.split(' ')[0]);
                    huidigTrajectSp += studiepunten;
                });

                // Calculate study points for courses not yet taken (unchecked in sidebar)
                Array.from(sidebarDropzone.children).forEach(courseCard => {
                    const checkbox = courseCard.querySelector('.checkbox');
                    if (checkbox && !checkbox.checked) {
                        const details = courseCard.querySelector('.details').textContent;
                        const studiepunten = parseInt(details.split(' ')[0]);
                        nogOpTeNemenSp += studiepunten;
                    }
                });

                // Update totals in the UI
                const totaleSp = behaaldeSp + huidigTrajectSp + nogOpTeNemenSp;
                behaaldeSpElement.textContent = `${behaaldeSp} SP`;
                huidigTrajectSpElement.textContent = `${huidigTrajectSp} SP`;
                nogOpTeNemenSpElement.textContent = `${nogOpTeNemenSp} SP`;
                totaleSpElement.textContent = `${totaleSp} SP`;
            };

            // --- SIDEBAR EMPTY MESSAGE ---
            // Shows a message if there are no more courses to take in the sidebar
            function showSidebarEmptyMessage() {
                if (sidebarDropzone.querySelectorAll('div.bg-white').length === 0) {
                    if (!sidebarDropzone.querySelector('.sidebar-empty-msg')) {
                        const msg = document.createElement('div');
                        msg.className = 'sidebar-empty-msg text-gray-400 text-center py-2';
                        msg.textContent = 'Geen vakken meer om op te nemen';
                        sidebarDropzone.appendChild(msg);
                    }
                } else {
                    const msg = sidebarDropzone.querySelector('.sidebar-empty-msg');
                    if (msg) sidebarDropzone.removeChild(msg);
                }
            }

            // --- UPDATE SIDEBAR AND POINTS ---
            // Call after any sidebar change to update UI and counters
            function updateSidebarAndPoints() {
                showSidebarEmptyMessage();
                updateStudyPoints();
            }

            // --- LOAD COURSES INTO SIDEBAR ---
            // For each course, create a draggable card with a checkbox
            data.vakken.forEach(vak => {
                const courseCard = document.createElement('div');
                courseCard.className = 'bg-white border border-gray-300 rounded-lg p-4 shadow-sm';
                courseCard.draggable = true;

                // Card content: course name, details, and completion checkbox
                courseCard.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-gray-800 font-medium">${vak.naam}</span>
                            <span class="text-gray-500 details">${vak.studiepunten} SP - ${vak.periode.join('/')} - Schijf ${vak.schijf}</span>
                        </div>
                        <input type="checkbox" class="w-5 h-5 text-gray-500 border-gray-300 rounded focus:ring-indigo-500 checkbox" />
                    </div>
                `;

                // --- CHECKBOX HANDLER ---
                // Mark as completed (checked) or available (unchecked)
                const checkbox = courseCard.querySelector('.checkbox');
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        // Mark as completed: style and move to bottom
                        courseCard.classList.add('bg-gray-200', 'text-gray-500');
                        courseCard.classList.remove('bg-white', 'text-gray-800');
                        courseCard.draggable = false; // Disable dragging
                        sidebarDropzone.appendChild(courseCard); // Move to the bottom
                    } else {
                        // Mark as available: style and move to top
                        courseCard.classList.remove('bg-gray-200', 'text-gray-500');
                        courseCard.classList.add('bg-white', 'text-gray-800');
                        courseCard.draggable = true; // Enable dragging
                        sidebarDropzone.prepend(courseCard); // Move back to the top
                    }
                    updateSidebarAndPoints();
                });

                // --- DRAG START HANDLER ---
                // When dragging a course, highlight valid dropzones
                courseCard.addEventListener('dragstart', (e) => {
                    if (!checkbox.checked) {
                        e.dataTransfer.setData('text/plain', JSON.stringify(vak));
                        e.dataTransfer.setData('source-id', courseCard.parentElement.id);
                        e.dataTransfer.setData('course-id', vak.naam); // Add course identifier

                        // Highlight valid dropzones and allow dragover
                        document.querySelectorAll('.dropzone').forEach(dropzone => {
                            const targetPeriod = dropzone.parentElement.getAttribute('data-period').split('/');
                            if (targetPeriod.some(period => vak.periode.includes(period))) {
                                dropzone.classList.add('bg-green-100', 'border-green-500');
                                dropzone.addEventListener('dragover', preventDefaultHandler);
                            } else {
                                dropzone.classList.add('bg-red-100', 'border-red-500');
                            }
                        });
                    }
                });

                // --- DRAG END HANDLER ---
                // Remove highlights from all dropzones
                courseCard.addEventListener('dragend', () => {
                    document.querySelectorAll('.dropzone').forEach(dropzone => {
                        dropzone.classList.remove('bg-green-100', 'border-green-500', 'bg-red-100', 'border-red-500');
                        dropzone.removeEventListener('dragover', preventDefaultHandler);
                    });
                });

                // Add the course card to the sidebar
                sidebarDropzone.appendChild(courseCard);
            });

            // --- TIMELINE DROPZONES ---
            // Handle dropping courses into timeline periods (modules/semesters)
            const dropzones = document.querySelectorAll('.dropzone');
            dropzones.forEach(dropzone => {
                dropzone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const vak = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const targetPeriod = dropzone.parentElement.getAttribute('data-period').split('/');

                    // Only allow drop if course period matches dropzone period
                    if (targetPeriod.some(period => vak.periode.includes(period))) {
                        const courseId = e.dataTransfer.getData('course-id');
                        const courseCard = [...sidebarDropzone.children, ...document.querySelectorAll('.dropzone > div')].find(card =>
                            card.querySelector('span.text-gray-800').textContent === courseId
                        );

                        if (courseCard) {
                            // Update card appearance and move to timeline
                            courseCard.querySelector('.checkbox').style.display = 'none';
                            const details = courseCard.querySelector('.details');
                            details.textContent = `${vak.studiepunten} SP`; // Show only study points
                            details.style.display = 'block';
                            courseCard.classList.add('text-xs'); // Smaller font size
                            dropzone.appendChild(courseCard); // Move to timeline
                            updateSidebarAndPoints();
                        }
                    }
                });
            });

            // --- SIDEBAR DROP HANDLER ---
            // Allow dropping courses back to the sidebar
            sidebarDropzone.addEventListener('dragover', (e) => {
                e.preventDefault();
            });

            sidebarDropzone.addEventListener('drop', (e) => {
                e.preventDefault();
                let vak, courseId;
                try {
                    vak = JSON.parse(e.dataTransfer.getData('text/plain'));
                    courseId = e.dataTransfer.getData('course-id');
                } catch {
                    return;
                }
                const courseCard = [...document.querySelectorAll('.dropzone > div')].find(card =>
                    card.querySelector('span.text-gray-800').textContent === courseId
                );
                if (courseCard) {
                    // Restore card appearance and move back to sidebar
                    courseCard.querySelector('.checkbox').style.display = 'block';
                    const details = courseCard.querySelector('.details');
                    details.textContent = `${vak.studiepunten} SP - ${vak.periode.join('/')} - Schijf ${vak.schijf}`;
                    details.style.display = 'block';
                    courseCard.classList.remove('text-xs');
                    sidebarDropzone.prepend(courseCard);
                    updateSidebarAndPoints();
                }
            });

            // --- UTILITY: Prevent default dragover behavior ---
            function preventDefaultHandler(e) {
                e.preventDefault();
            }

            // --- INITIALIZE UI ---
            // Initial calculation of study points and sidebar message
            updateSidebarAndPoints();
        })
        .catch(error => console.error('Error loading curriculum:', error));
});
