const events = {
    click: "click",
    input: "input",
    change: "change"
};

const elements = {
    screenProgressDialog: document.querySelector("#screen-progress-dialog"),
    screenProgressSpinnerContainer: document.querySelector("#screen-progress-dialog #screen-progress-spinner-container"),
    screenProgressBar: document.querySelector("#screen-progress-dialog #screen-progress-bar"),
    screenProgressEvent: document.querySelector("#screen-progress-dialog #screen-progress-event"),
    screenProgressInputContainer: document.querySelector("#screen-progress-dialog #screen-progress-input-container"),
    screenProgressInput: document.querySelector("#screen-progress-dialog input[name='projectName']"),
    screenProgressDialogFooter: document.querySelector("#screen-progress-dialog .modal-footer"),
    createProjectTrigger: document.querySelector("#screen-progress-dialog .modal-footer button"),
    projectNameDisplay: document.querySelector("#project-name-display"),
    fs: document.querySelector("#app #fs"),
    fsViewer: document.querySelector("#fs #fs-viewer"),
    fsViewerNode: document.querySelectorAll("#fs #fs-viewer li"),
    editor: document.querySelector("#app #editor"),
    // codeArea: document.querySelector("#app #editor code"),
    controlPlane: document.querySelector("#app #control-plane"),
    createAppTrigger: document.querySelector("#app #control-plane #create-app-trigger"),
    createModelTrigger: document.querySelector("#app #control-plane #create-model-trigger"),
    downloadZIPTrigger: document.querySelector("#download-zip-trigger"),
}

const dialogs = {
    screenProgressDialog: new bootstrap.Modal(elements.screenProgressDialog, {
        backdrop: 'static',
    }),
}

function toggleFade(element, isVisible) {
    if (isVisible) {
        // Fade in: Remove `d-none`, add `fade-in`, and remove `fade-out` if it exists
        element.classList.remove('d-none', 'fade-out');
        element.classList.add('fade-in');
    } else {
        // Fade out: Add `fade-out`, wait for the transition to complete, then hide
        element.classList.remove('fade-in');
        element.classList.add('fade-out');

        // Wait for the fade-out transition to complete
        element.addEventListener('transitionend', () => {
            element.classList.add('d-none'); // Hide the element after fade-out
        }, { once: true });
    }
}

function toggleButton(element, isDisabled) {
    if (isDisabled) {
        element.setAttribute("disabled", true)
    }
    else {
        element.removeAttribute("disabled")
    }
}

function registerEvenets() {
    registerCreateProjectFormEvent();
    registerCreateProjectEvent();
    registerCreateAppEvent();
    registerCreateModelEvent();
    registerDownloadZIPEvent();
}

function registerCreateProjectFormEvent() {
    elements.screenProgressInput.addEventListener(events.input, async () => {
        const projectName = elements.screenProgressInput.value
        toggleButton(elements.createProjectTrigger, !projectName)
    })
}

function registerCreateProjectEvent() {
    elements.createProjectTrigger.addEventListener(events.click, async () => {
        toggleButton(elements.createProjectTrigger, true);

        const projectName = elements.screenProgressInput.value;
        await runDjangoAdminCommand("startproject", projectName);

        saveValue(storeKeys.projectName, projectName);

        dialogs.screenProgressDialog.hide();

        loadApplication();
    })
}

function loadApplication() {
    const projectName = loadValue(storeKeys.projectName);
    chdir(projectName);

    const rootLevel = listDir("");
    elements.projectNameDisplay.textContent = projectName;
    for (entry of rootLevel) {
        const node = document.createElement("li")
        node.classList.add("list-unstyled")
        node.textContent = entry
        node.dataset.path = entry;
        registerViewFileEvent(node);
        elements.fsViewer.appendChild(node)
    }

    // TODO: more resuable and automatic
    elements.fsViewerNode = document.querySelectorAll("#fs #fs-viewer li")
}

function registerViewFileEvent(node) {
    node.addEventListener(events.click, async (event) => {
        event.stopPropagation()

        // TODO: check if ./ is needed
        const path = "./" + node.dataset.path;
        if (await isFile(path)) {
            const content = await loadFile(path);
            window.editor.setValue(content);
        }
        else {
            const topNode = document.createElement("ul")
            node.appendChild(topNode)
            for (entry of listDir(path)) {
                const childNode = document.createElement("li")
                childNode.classList.add("list-unstyled")
                childNode.textContent = entry
                childNode.dataset.path = `${path}/${entry}`;
                // TODO: seems recursive
                registerViewFileEvent(childNode);
                topNode.appendChild(childNode)
            }
        }
    })
}

function registerCreateAppEvent() {
    elements.createAppTrigger.addEventListener(events.click, async () => {
        toggleButton(elements.createAppTrigger, true)

        const appName = "myapp";

        await runDjangoAdminCommand("startapp", appName)

        toggleButton(elements.createAppTrigger, false)

        // invalidate fs
        // TOOD: better
        const node = document.createElement("li")
        node.classList.add("list-unstyled")
        node.textContent = appName
        node.dataset.path = appName;
        registerViewFileEvent(node);
        elements.fsViewer.appendChild(node)
    })
}


function registerCreateModelEvent() {
    elements.createModelTrigger.addEventListener(events.click, async () => {
        toggleButton(elements.createModelTrigger, true)

        // if existed then append or maybe create new file XDDDD
        await saveFile(path, `
            from django import db

            class Model(db.Model):

              class Meta:
                verbose_name = "model"
            `);

        toggleButton(elements.createModelTrigger, false)
    })
}

async function registerDownloadZIPEvent() {
    elements.downloadZIPTrigger.addEventListener(events.click, async () => {
        toggleButton(elements.downloadZIPTrigger, true)

        await downloadProject()

        toggleButton(elements.downloadZIPTrigger, false)
    })
}