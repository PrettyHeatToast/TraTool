document.addEventListener("DOMContentLoaded", () => {
    fetch('./curriculum.json')
        .then(response => response.json())
        .then(data => {
            // Dynamically load the name of the opleiding
            const header = document.querySelector('header p');
            header.textContent = `${data.opleiding.onderwijsinstelling} - ${data.opleiding.naam}`;

            const vakkenLijst = document.getElementById('vakkenLijst');
            const behaaldeSpElement = document.getElementById('behaaldeSp');
            const huidigTrajectSpElement = document.getElementById('huidigTrajectSp');
            const totaleSpElement = document.querySelectorAll('#huidigTrajectSp')[1];

            vakkenLijst.innerHTML = ''; // Clear existing content

            const updateStudyPoints = () => {
                let behaaldeSp = 0;
                let huidigTrajectSp = 0;

                // Calculate behaalde studiepunten
                document.querySelectorAll('#vakkenLijst .checkbox:checked').forEach(checkbox => {
                    const courseCard = checkbox.closest('div');
                    const details = courseCard.querySelector('.details').textContent;
                    const studiepunten = parseInt(details.split(' ')[0]);
                    behaaldeSp += studiepunten;
                });

                // Calculate studiepunten in huidig traject
                document.querySelectorAll('.dropzone > div').forEach(courseCard => {
                    const details = courseCard.querySelector('.details').textContent;
                    const studiepunten = parseInt(details.split(' ')[0]);
                    huidigTrajectSp += studiepunten;
                });

                // Update totals
                const totaleSp = behaaldeSp + huidigTrajectSp;
                behaaldeSpElement.textContent = `${behaaldeSp} SP`;
                huidigTrajectSpElement.textContent = `${huidigTrajectSp} SP`;
                totaleSpElement.textContent = `${totaleSp} SP`;
            };

            data.vakken.forEach(vak => {
                const courseCard = document.createElement('div');
                courseCard.className = 'bg-white border border-gray-300 rounded-lg p-4 shadow-sm';
                courseCard.draggable = true;

                courseCard.innerHTML = `
                    <div class="flex items-center justify-between">
                        <div class="flex flex-col">
                            <span class="text-gray-800 font-medium">${vak.naam}</span>
                            <span class="text-indigo-600 details">${vak.studiepunten} SP - ${vak.periode.join('/')}</span>
                        </div>
                        <input type="checkbox" class="w-5 h-5 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 checkbox" />
                    </div>
                `;

                const checkbox = courseCard.querySelector('.checkbox');
                checkbox.addEventListener('change', () => {
                    if (checkbox.checked) {
                        courseCard.classList.add('bg-gray-200', 'text-gray-500');
                        courseCard.classList.remove('bg-white', 'text-gray-800');
                        courseCard.draggable = false; // Disable dragging
                        vakkenLijst.appendChild(courseCard); // Move to the bottom
                    } else {
                        courseCard.classList.remove('bg-gray-200', 'text-gray-500');
                        courseCard.classList.add('bg-white', 'text-gray-800');
                        courseCard.draggable = true; // Enable dragging
                        vakkenLijst.prepend(courseCard); // Move back to the top
                    }
                    updateStudyPoints();
                });

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

                courseCard.addEventListener('dragend', () => {
                    // Remove highlights from all dropzones and remove dragover listener
                    document.querySelectorAll('.dropzone').forEach(dropzone => {
                        dropzone.classList.remove('bg-green-100', 'border-green-500', 'bg-red-100', 'border-red-500');
                        dropzone.removeEventListener('dragover', preventDefaultHandler);
                    });
                });

                vakkenLijst.appendChild(courseCard);
            });

            const dropzones = document.querySelectorAll('.dropzone');
            dropzones.forEach(dropzone => {
                dropzone.addEventListener('drop', (e) => {
                    e.preventDefault();
                    const vak = JSON.parse(e.dataTransfer.getData('text/plain'));
                    const targetPeriod = dropzone.parentElement.getAttribute('data-period').split('/');

                    if (targetPeriod.some(period => vak.periode.includes(period))) {
                        const courseId = e.dataTransfer.getData('course-id');
                        const courseCard = [...vakkenLijst.children, ...document.querySelectorAll('.dropzone > div')].find(card =>
                            card.querySelector('span.text-gray-800').textContent === courseId
                        );

                        if (courseCard) {
                            // Update courseCard appearance and move it to the new dropzone
                            courseCard.querySelector('.checkbox').style.display = 'none';
                            const details = courseCard.querySelector('.details');
                            details.textContent = `${vak.studiepunten} SP`; // Show only studiepunten
                            details.style.display = 'block';
                            courseCard.classList.add('text-sm'); // Apply smaller font size
                            dropzone.appendChild(courseCard); // Move courseCard to the new timeline period
                            updateStudyPoints();
                        }
                    }
                });
            });

            vakkenLijst.addEventListener('dragover', (e) => {
                e.preventDefault(); // Allow drop back to the sidebar
            });

            vakkenLijst.addEventListener('drop', (e) => {
                e.preventDefault();
                const vak = JSON.parse(e.dataTransfer.getData('text/plain'));
                const courseId = e.dataTransfer.getData('course-id');
                const courseCard = [...document.querySelectorAll('.dropzone > div')].find(card =>
                    card.querySelector('span.text-gray-800').textContent === courseId
                );

                if (courseCard) {
                    // Show checkbox and period, and reset font size when moved back to the sidebar
                    courseCard.querySelector('.checkbox').style.display = 'block';
                    const details = courseCard.querySelector('.details');
                    details.textContent = `${vak.studiepunten} SP - ${vak.periode.join('/')}`; // Restore full details
                    details.style.display = 'block';
                    courseCard.classList.remove('text-sm'); // Reset font size
                    vakkenLijst.prepend(courseCard); // Move courseCard back to the sidebar
                    updateStudyPoints();
                }
            });

            function preventDefaultHandler(e) {
                e.preventDefault();
            }

            // Initial calculation of study points
            updateStudyPoints();
        })
        .catch(error => console.error('Error loading curriculum:', error));
});
