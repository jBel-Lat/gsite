<?php require_once 'includes/header.php'; ?>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/dracula.min.css">

<style>
    .ide-container { display: grid; grid-template-columns: 2fr 1fr; gap: 20px; }
    .CodeMirror { height: 500px; border-radius: 12px; font-size: 14px; border: 1px solid var(--border-color); }
    .ai-panel { background: rgba(0,0,0,0.25); border-radius:12px; border:1px solid var(--border-color); display:flex; flex-direction:column; }
    .ai-header { padding: 15px; border-bottom: 1px solid var(--border-color); display:flex; align-items:center; gap:10px; font-weight:600; color:var(--primary); }
    .ai-chat { flex:1; padding:15px; overflow-y:auto; max-height: 400px; display:flex; flex-direction:column; gap:12px; }
    .msg { padding: 8px 12px; border-radius:10px; font-size:13px; max-width:90%; position:relative; }
    .msg.bot { background: rgba(59,130,246,0.15); color: #fff; align-self:flex-start; border-left:3px solid var(--primary); }
    .msg.user { background: rgba(255,255,255,0.05); color: var(--text-muted); align-self:flex-end; }
    .sandbox-tag { background:var(--danger); color:#fff; font-size:10px; padding:2px 6px; border-radius:4px; text-transform:uppercase; font-weight:700; }
</style>

<div class="panel" style="margin-bottom:20px; border-bottom: 4px solid var(--danger);">
    <div style="display:flex; justify-content:space-between; align-items:center;">
        <h3 class="panel-title"><i class="fas fa-vial"></i> Query Sandbox — <span class="sandbox-tag">Sandboxed DB</span></h3>
        <p class="text-muted" style="font-size:12px; margin:0;">Queries run against <strong>cc_gsite_sandbox</strong> only.</p>
    </div>
</div>

<div class="ide-container">
    <!-- Editor -->
    <div>
        <div class="panel" style="padding:0; overflow:hidden;">
            <div style="background:var(--bg-card); padding:10px 15px; border-bottom:1px solid var(--border-color); display:flex; justify-content:space-between; align-items:center;">
                <div style="display:flex; gap:10px;">
                    <div class="badge badge-info"><i class="fas fa-terminal"></i> SQL / PHP / HTML</div>
                </div>
                <form id="ideForm" method="POST" style="margin:0;">
                    <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                    <textarea id="codeEditor" name="sql_query" style="display:none;"><?= isset($_POST['sql_query']) ? htmlspecialchars($_POST['sql_query']) : "SELECT * FROM users LIMIT 10;" ?></textarea>
                    <button type="submit" class="btn btn-success btn-sm"><i class="fas fa-play"></i> Run Sandbox Query</button>
                    <button type="button" class="btn btn-primary btn-sm" onclick="suggestCode()"><i class="fas fa-magic"></i> AI Suggest</button>
                </form>
            </div>
            <textarea id="cm_editor"></textarea>
        </div>

        <?php if(isset($queryResult) || isset($queryError)): ?>
        <div class="panel" style="margin-top:20px;">
            <div class="panel-header"><h3 class="panel-title"><i class="fas fa-poll"></i> Result</h3></div>
            <div style="overflow:auto; max-height:400px; background:rgba(0,0,0,0.2); padding:15px; border-radius:8px;">
                <?php if($queryError): ?>
                    <div style="color:var(--danger); font-size:13px;"><i class="fas fa-exclamation-triangle"></i> <?= htmlspecialchars($queryError) ?></div>
                <?php elseif(!empty($queryResult)): ?>
                    <table class="table" style="font-size:12px;">
                        <thead><tr><?php foreach(array_keys($queryResult[0]) as $col): ?><th><?= htmlspecialchars($col) ?></th><?php endforeach; ?></tr></thead>
                        <tbody><?php foreach($queryResult as $row): ?><tr><?php foreach($row as $val): ?><td><?= htmlspecialchars((string)$val) ?></td><?php endforeach; ?></tr><?php endforeach; ?></tbody>
                    </table>
                <?php endif; ?>
            </div>
        </div>
        <?php endif; ?>
    </div>

    <!-- AI Panel -->
    <div class="ai-panel">
        <div class="ai-header"><i class="fas fa-robot"></i> Developer AI Assistant</div>
        <div class="ai-chat" id="aiChat">
            <div class="msg bot">Hello! I'm your AI coding assistant. I can suggest SQL queries, help with PHP logic, or fix HTML/CSS bugs. Click "AI Suggest" or type below!</div>
        </div>
        <div style="padding:15px; border-top:1px solid var(--border-color);">
            <div style="display:flex; gap:8px;">
                <input type="text" id="aiInput" class="form-control" placeholder="Ask AI anything…" onkeypress="if(event.key==='Enter') sendAIMsg()">
                <button class="btn btn-primary" onclick="sendAIMsg()"><i class="fas fa-paper-plane"></i></button>
            </div>
        </div>
    </div>
</div>

<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/sql/sql.min.js"></script>
<script>
    var cm = CodeMirror.fromTextArea(document.getElementById('cm_editor'), {
        mode: 'text/x-sql', theme: 'dracula', lineNumbers: true, matchBrackets: true
    });
    cm.setValue(document.getElementById('codeEditor').value);
    cm.on('change', () => { document.getElementById('codeEditor').value = cm.getValue(); });

    function suggestCode() {
        addMsg('user', 'Suggest a query for the sandbox.');
        setTimeout(() => {
            addMsg('bot', 'Try: SELECT * FROM sandbox_test;');
            cm.setValue('SELECT * FROM sandbox_test;');
        }, 800);
    }

    function sendAIMsg() {
        const input = document.getElementById('aiInput');
        if(!input.value.trim()) return;
        addMsg('user', input.value);
        const q = input.value.toLowerCase();
        input.value = '';
        
        setTimeout(() => {
            let resp = "I'm not sure how to help with that specifically, but I can help with SQL, PHP, and HTML code!";
            if(q.includes('select')) resp = "To select data, use: SELECT column FROM table WHERE condition;";
            else if(q.includes('error')) resp = "Check your syntax! Make sure all brackets are closed and semicolons are present.";
            addMsg('bot', resp);
        }, 1000);
    }

    function addMsg(role, text) {
        const chat = document.getElementById('aiChat');
        chat.innerHTML += `<div class="msg ${role}">${text}</div>`;
        chat.scrollTop = chat.scrollHeight;
    }
</script>

<?php require_once 'includes/footer.php'; ?>
