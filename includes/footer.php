<?php
// includes/footer.php
?>
            </main> <!-- End content-area -->
        </div> <!-- End main-content -->
    </div> <!-- End dashboard-wrapper -->

    <!-- Core Scripts -->
    <script>
        // Simple sidebar toggle
        document.addEventListener('DOMContentLoaded', function() {
            const toggleBtn = document.getElementById('sidebar-toggle');
            const sidebar = document.getElementById('sidebar');
            if(toggleBtn && sidebar) {
                toggleBtn.addEventListener('click', function() {
                    sidebar.classList.toggle('collapsed');
                });
            }
        });
    </script>
</body>
</html>
