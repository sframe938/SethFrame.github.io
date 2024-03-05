// Attach event listeners using a loop
['fromDept', 'inDept', 'requestKind', 'serviceKind', 'updateType', 'notifyDist', 'delBusClass', 'software', 'hosted', 'runtimeContent'].forEach(id => {
    const element = document.getElementById(id);
    if (element) {
        element.addEventListener('change', () => handleInputChange(id));
    }
});

document.getElementById("runtimeContent").addEventListener('click', handleRuntimeContentClick);

// Handle input change event
function handleInputChange(id) {
    const element = document.getElementById(id);
    if (element) {
        switch (id) {
            case 'fromDept':
                toggleRequired("fromDept", "fromSup", "inImp");
                break;
            case 'inDept':
                removeOption("inDept", "inSal", "fromDept", 1);
                document.getElementById("sec16").style.display = 'block';
                toggleHidden("inDept", "inOther", "sec15a");
                break;
            case 'requestKind':
                toggleHidden("requestKind", "otherReq", "sec25a");
                break;
            case 'serviceKind':
                toggleHidden("serviceKind", "otherService", "sec41a");
                break;
            case 'updateType':
                toggleHidden("updateType", "otherUp", "sec49a");
                break;
            case 'notifyDist':
                toggleHidden("notifyDist", "notifyDistNo", "sec53a");
                break;
            case 'delBusClass':
                toggleHidden("delBusClass", "delClassOther", "sec55a");
                break;
            case 'software':
                toggleSTFields();
                toggleRPFields();
                break;
            case 'hosted':
                toggleHidden("hosted", "noHost", "sec20");
                break;
            default:
                break;
        }
    }
}

// Handle runtime content button click
function handleRuntimeContentClick() {
    removeOption("runtimeContent", "runtimeContent", "software", 3);
    
    //Toggle Hidden Off
    ['sec1','sec2'].forEach(id => {
        toggleHidden("runtimeContent", "off", id);
    });
    
    //Toggle Hidden On
    ['sec16','sec25', 'sec40', 'sec42', 'sec49'].forEach(id => {
        toggleHidden("runtimeContent", "runtimeContent", id);
    });
    
    //Toggle Required Off
    ['descript', 'severity'].forEach(id => {
        toggleRequired("runtimeContent", "off", id);
    });
    
    //Toggle Required On
    ['requestKind', 'state', 'rtcType', 'updateType'].forEach(id => {
        toggleRequired("runtimeContent", "runtimeContent", id);
    });
    
    //Add Pass Class
    ['sec5', 'sec7', 'sec8', 'sec9', 'sec11', 'sec12', 'sec13', 'sec14'].forEach(id => {
        document.getElementById(id).classList.add('pass');
    });
    //Set Values
    document.getElementById("fromDept").value = "fromDevOps";
    document.getElementById("requestKind").value = "tydReq";
    document.getElementById("updateType").value = "rtcUp";
}

// Toggle software field visibility
// Student Transportation
function toggleSTFields() {
    ['sec5', 'sec6', 'sec7', 'sec8', 'sec9'].forEach(id => {
        toggleHidden("software", "st", id);
    });
    ['sturl','inImp'].forEach(id =>{
        toggleRequired("software", "st", id);
    })
}
//Routing & Planning
function toggleRPFields() {
    ['sec10', 'sec11', 'sec12', 'sec13', 'sec14'].forEach(id => {
        toggleHidden("software", "rp", id);
    });
    ['hosted','rpver','rpbuild','sqlVer'].forEach(id =>{
        toggleRequired("software", "rp", id);
    })
}

// Toggle visibility based on trigger value
function toggleHidden(triggerId, value, targetId) {
    const trigger = document.getElementById(triggerId);
    const target = document.getElementById(targetId);
    if (trigger && target) {
        target.style.display = trigger.value === value && !target.classList.contains("pass") ? 'block' : 'none';
    }
}

// Toggle required attribute based on trigger value (GPT)
function toggleRequired(triggerId, value, targetId) {
    const trigger = document.getElementById(triggerId);
    const target = document.getElementById(targetId);
    if (trigger.value == value) {
        target.setAttribute("required", trigger.value === value)
        target.parentNode.style.fontWeight = trigger.value === value ? 'bold' : 'normal';
    }
}

// Remove option based on trigger value
function removeOption(triggerId, value, targetId, index) {
    const trigger = document.getElementById(triggerId);
    const target = document.getElementById(targetId);
    if (trigger && target) {
        if (trigger.value === value && !target.classList.contains("pass")) {
            target.remove(index);
            target.classList.add('pass');
        }
    }
}
