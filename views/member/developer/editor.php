<?php 
require_once 'includes/header.php'; 

// Simple PHP logic to handle basic SQL Query execution (for demonstration purposes according to requirements)
$queryResult = null;
$queryError = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['sql_query'])) {
    Auth::verifyCSRF($_POST['csrf_token']);
    $query = trim($_POST['sql_query']);
    if (!empty($query)) {
        try {
            $conn = Database::getConnection();
            $stmt = $conn->prepare($query);
            $stmt->execute();
            if (stripos($query, 'SELECT') === 0 || stripos($query, 'SHOW') === 0 || stripos($query, 'DESCRIBE') === 0) {
                $queryResult = $stmt->fetchAll(PDO::FETCH_ASSOC);
            } else {
                $queryResult = ["Status" => "Query executed successfully. Row count: " . $stmt->rowCount()];
            }
        } catch (PDOException $e) {
            $queryError = $e->getMessage();
        }
    }
}
?>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/dracula.min.css">
<style>
    .CodeMirror { height: 400px; border-radius: 8px; font-family: 'Fira Code', monospace; font-size: 14px; }
    .ide-tabs { display: flex; gap: 10px; margin-bottom: 15px; }
    .ide-tab { padding: 8px 16px; background: rgba(255,255,255,0.05); border-radius: 6px; cursor: pointer; border: 1px solid var(--border-color); color: var(--text-muted); }
    .ide-tab.active { background: var(--primary); color: #fff; border-color: var(--primary); }
</style>

<div class="panel">
    <div class="panel-header">
        <h3 class="panel-title"><i class="fas fa-file-code"></i> IDE & Query Sandbox</h3>
    </div>
    
    <div class="ide-tabs">
        <div class="ide-tab active" onclick="switchMode('sql')">SQL Query</div>
        <div class="ide-tab" onclick="switchMode('htmlmixed')">HTML/CSS/JS</div>
        <div class="ide-tab" onclick="switchMode('php')">PHP Snippet</div>
    </div>
    
    <div style="display: flex; gap: 20px;">
        <div style="flex: 2;">
            <form id="ideForm" method="POST">
                <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                <textarea id="codeEditor" name="sql_query"><?= isset($_POST['sql_query']) ? htmlspecialchars($_POST['sql_query']) : 'SELECT * FROM users LIMIT 5;' ?></textarea>
                <div style="margin-top: 15px; display: flex; justify-content: space-between;">
                    <button type="submit" class="btn btn-success"><i class="fas fa-play"></i> Execute Query</button>
                    <div>
                        <button type="button" class="btn btn-info" onclick="exportCode()"><i class="fas fa-download"></i> Export</button>
                        <button type="button" class="btn btn-warning" onclick="document.getElementById('importFile').click()"><i class="fas fa-upload"></i> Import</button>
                        <input type="file" id="importFile" style="display:none" onchange="importCode(event)">
                    </div>
                </div>
            </form>
        </div>
        
        <div style="flex: 1; background: var(--bg-dark); border-radius: 8px; padding: 15px; border: 1px solid var(--border-color); overflow: auto; max-height: 480px;">
            <h4 style="margin-top:0; border-bottom: 1px solid var(--border-color); padding-bottom: 10px;">Output</h4>
            
            <?php if(isset($queryError)): ?>
                <div style="color: var(--danger); font-size: 13px;"><?= htmlspecialchars($queryError) ?></div>
            <?php elseif($queryResult !== null): ?>
                <?php if(isset($queryResult['Status'])): ?>
                    <div style="color: var(--success); font-size: 13px;"><?= $queryResult['Status'] ?></div>
                <?php elseif(is_array($queryResult) && count($queryResult) > 0): ?>
                    <div class="table-responsive">
                        <table class="table" style="font-size: 12px;">
                            <thead>
                                <tr>
                                    <?php foreach(array_keys($queryResult[0]) as $col): ?>
                                    <th><?= htmlspecialchars($col) ?></th>
                                    <?php endforeach; ?>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach($queryResult as $row): ?>
                                <tr>
                                    <?php foreach($row as $val): ?>
                                    <td><?= htmlspecialchars((string)$val) ?></td>
                                    <?php endforeach; ?>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                <?php else: ?>
                    <div style="color: var(--text-muted); font-size: 13px;">Empty set.</div>
                <?php endif; ?>
            <?php else: ?>
                <div style="color: var(--text-muted); font-size: 13px;">Ready.</div>
            <?php endif; ?>
        </div>
    </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/sql/sql.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/xml/xml.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/css/css.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/htmlmixed/htmlmixed.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/clike/clike.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/php/php.min.js"></script>

<script>
    var editor = CodeMirror.fromTextArea(document.getElementById('codeEditor'), {
        mode: 'text/x-sql',
        theme: 'dracula',
        lineNumbers: true,
        matchBrackets: true,
        indentUnit: 4
    });

    function switchMode(mode) {
        document.querySelectorAll('.ide-tab').forEach(t => t.classList.remove('active'));
        event.target.classList.add('active');
        
        let targetMode = 'text/plain';
        if(mode === 'sql') targetMode = 'text/x-sql';
        if(mode === 'htmlmixed') targetMode = 'htmlmixed';
        if(mode === 'php') targetMode = 'application/x-httpd-php';
        
        editor.setOption("mode", targetMode);
    }
    
    function exportCode() {
        const text = editor.getValue();
        const blob = new Blob([text], { type: 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'code_export_' + new Date().getTime() + '.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }
    
    function importCode(event) {
        const file = event.target.files[0];
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(e) {
            editor.setValue(e.target.result);
        };
        reader.readAsText(file);
    }
</script>

<?php require_once 'includes/footer.php'; ?>
