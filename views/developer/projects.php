<?php require_once 'includes/header.php'; ?>

<style>
    .project-grid { display: grid; grid-template-columns: 1fr 2fr; gap: 20px; }
    .file-tree { background: rgba(0,0,0,0.2); border-radius:12px; border:1px solid var(--border-color); padding:15px; max-height: 800px; overflow-y: auto; }
    .tree-item { padding: 8px 12px; border-radius:6px; cursor:pointer; display:flex; align-items:center; gap:10px; font-size:13px; transition:all 0.2s; color:var(--text-muted); }
    .tree-item:hover { background: rgba(255,255,255,0.05); color:var(--text-primary); }
    .tree-item.active { background: var(--primary); color:#fff; }
    .tree-item i { width: 16px; text-align:center; }
    .editor-container { display:none; flex-direction:column; gap:15px; }
    .editor-active { display:flex; }
    #codeEditorProject { height: 500px; border-radius:8px; font-size:14px; }
</style>

<div class="project-grid">
    <!-- Left: File Tree & History -->
    <div>
        <div class="panel">
            <div class="panel-header">
                <h3 class="panel-title"><i class="fas fa-sitemap"></i> Project Files</h3>
                <button class="btn btn-primary btn-sm" onclick="document.getElementById('uploadFile').click()"><i class="fas fa-plus"></i></button>
            </div>
            <form id="uploadForm" action="<?= BASE_URL ?>/developer/projects" method="POST" enctype="multipart/form-data" style="display:none;">
                <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                <input type="hidden" name="action" value="upload">
                <input type="file" name="file" id="uploadFile" onchange="this.form.submit()">
            </form>

            <div class="file-tree">
                <?php foreach($files as $f): ?>
                <div class="tree-item" onclick="openFile(<?= $f['id'] ?>, '<?= addslashes($f['filename']) ?>', <?= htmlspecialchars(json_encode($f['file_content'])) ?>, '<?= $f['filetype'] ?>')">
                    <i class="fas fa-<?= in_array($f['filetype'], ['jpg','png','gif']) ? 'image' : (in_array($f['filetype'], ['php','html','css','js']) ? 'code' : 'file-alt') ?>"></i>
                    <span style="flex:1;"><?= htmlspecialchars($f['filename']) ?></span>
                    <?php if($_SESSION['role'] === 'developer_head'): ?>
                    <form action="<?= BASE_URL ?>/developer/projects" method="POST" onsubmit="return confirm('Delete <?= $f['filename'] ?>?')">
                        <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                        <input type="hidden" name="action" value="delete_file">
                        <input type="hidden" name="file_id" value="<?= $f['id'] ?>">
                        <button type="submit" style="background:none; border:none; color:var(--danger); cursor:pointer; font-size:12px;"><i class="fas fa-trash"></i></button>
                    </form>
                    <?php endif; ?>
                </div>
                <?php endforeach; ?>
                <?php if(empty($files)): ?><p class="text-muted text-center" style="font-size:12px; padding:20px;">No files yet. Upload one!</p><?php endif; ?>
            </div>
        </div>

        <div class="panel" style="margin-top:20px;">
            <div class="panel-header"><h3 class="panel-title" style="font-size:14px;"><i class="fas fa-history"></i> Recent Changes</h3></div>
            <div style="font-size:11px; color:var(--text-muted);">
                <?php foreach($history as $h): ?>
                <div style="border-bottom:1px solid rgba(255,255,255,0.05); padding:8px 0;">
                    <strong style="color:var(--primary);"><?= htmlspecialchars($h['filename']) ?></strong> - <?= htmlspecialchars($h['change_summary']) ?>
                    <div style="margin-top:2px;">By <?= htmlspecialchars($h['editor_name']) ?> &bull; <?= date('M d H:i', strtotime($h['changed_at'])) ?></div>
                </div>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <!-- Right: Editor & Discussion -->
    <div id="editorPanel" class="editor-container">
        <div class="panel">
            <div class="panel-header">
                <h3 class="panel-title"><i class="fas fa-edit"></i> Editing: <span id="currentFileName">None</span></h3>
                <div style="display:flex; gap:8px;">
                    <button class="btn btn-success btn-sm" onclick="saveFile()"><i class="fas fa-save"></i> Save</button>
                    <button class="btn btn-warning btn-sm" onclick="closeEditor()"><i class="fas fa-times"></i> Close</button>
                </div>
            </div>
            <textarea id="codeEditorProject"></textarea>
            
            <!-- Comment Section -->
            <div style="margin-top:20px; border-top:1px solid var(--border-color); padding-top:15px;">
                <h4 style="font-size:14px; margin-bottom:12px;"><i class="fas fa-comments"></i> File Discussion</h4>
                <div id="fileComments" style="max-height:200px; overflow-y:auto; margin-bottom:15px;">
                    <!-- JS populated -->
                </div>
                <form id="commentForm" action="<?= BASE_URL ?>/developer/projects" method="POST" style="display:flex; gap:8px;">
                    <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
                    <input type="hidden" name="action" value="comment">
                    <input type="hidden" name="file_id" id="commentFileId">
                    <input type="text" name="comment" class="form-control form-control-sm" placeholder="Add a comment…" required>
                    <button type="submit" class="btn btn-primary btn-sm"><i class="fas fa-paper-plane"></i></button>
                </form>
            </div>
        </div>
    </div>

    <!-- Default view when nothing open -->
    <div id="noPanel" class="panel" style="display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; color:var(--text-muted); opacity:0.6;">
        <i class="fas fa-code" style="font-size:60px; margin-bottom:20px;"></i>
        <h3>GitHub-like Project Management</h3>
        <p>Select a file from the left sidebar to open the inline editor,<br>track history, and collaborate with your team.</p>
    </div>
</div>

<!-- Save Form (hidden) -->
<form id="saveForm" action="<?= BASE_URL ?>/developer/projects" method="POST" style="display:none;">
    <input type="hidden" name="csrf_token" value="<?= Auth::generateCSRF() ?>">
    <input type="hidden" name="action" value="save_edit">
    <input type="hidden" name="file_id" id="saveFileId">
    <textarea name="file_content" id="saveFileContent"></textarea>
    <input type="hidden" name="change_summary" id="saveSummary">
</form>

<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.css">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/theme/dracula.min.css">
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/codemirror.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/php/php.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/javascript/javascript.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/css/css.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/codemirror/5.65.13/mode/htmlmixed/htmlmixed.min.js"></script>

<script>
let currentFileId = null;
const editor = CodeMirror.fromTextArea(document.getElementById('codeEditorProject'), {
    theme: 'dracula', lineNumbers: true, matchBrackets: true, indentUnit: 4
});
const allComments = <?= json_encode($comments) ?>;

function openFile(id, name, content, type) {
    currentFileId = id;
    document.getElementById('editorPanel').classList.add('editor-active');
    document.getElementById('noPanel').style.display = 'none';
    document.getElementById('currentFileName').innerText = name;
    
    // Set editor mode
    let mode = 'text/x-php';
    if(type === 'js') mode = 'javascript';
    else if(type === 'css') mode = 'css';
    else if(type === 'html') mode = 'htmlmixed';
    editor.setOption('mode', mode);
    editor.setValue(content || '');
    
    // Set comments
    document.getElementById('commentFileId').value = id;
    const commentBox = document.getElementById('fileComments');
    commentBox.innerHTML = '';
    (allComments[id] || []).forEach(c => {
        commentBox.innerHTML += `
            <div style="background:rgba(255,255,255,0.05); padding:8px 12px; border-radius:6px; margin-bottom:8px; font-size:12px;">
                <strong>${c.author_name}:</strong> ${c.comment}
            </div>
        `;
    });
}

function saveFile() {
    const summary = prompt("What did you change? (Change summary)");
    if(summary === null) return;
    document.getElementById('saveFileId').value = currentFileId;
    document.getElementById('saveFileContent').value = editor.getValue();
    document.getElementById('saveSummary').value = summary || 'Updated file';
    document.getElementById('saveForm').submit();
}

function closeEditor() {
    document.getElementById('editorPanel').classList.remove('editor-active');
    document.getElementById('noPanel').style.display = 'flex';
}
</script>

<?php require_once 'includes/footer.php'; ?>
