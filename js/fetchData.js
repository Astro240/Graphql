document.addEventListener('DOMContentLoaded', async () => {
    await fetchProfile();
});

async function fetchProfile() {
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                query: `
                {
                    user {
                        id
                        login
                        auditRatio
                        totalUp
                        totalDown
                        attrs
                    }
                    transaction {
                        id
                        type
                        amount
                        objectId
                        userId
                        createdAt
                        path
                    }
                    transaction_aggregate(
                        where: {
                        _and: [
                            { type: { _eq: "xp" } },
                            { path: { _like: "/bahrain/bh-module/%" } }
                            { path: { _nlike: "/bahrain/bh-module/piscine-js/%"} }
                        ]
                        }
                    ) {
                        aggregate {
                            sum {
                                amount
                            }
                        }
                    }
                    js:transaction_aggregate(
                        where: {
                        _and: [
                            { type: { _eq: "xp" } },
                            { path: { _like: "/bahrain/bh-module/piscine-js/%" } }
                        ]
                        }
                    ) {
                        aggregate {
                            sum {
                                amount
                            }
                        }
                    }
                        go:transaction_aggregate(
                        where: {
                        _and: [
                            { type: { _eq: "xp" } },
                            { path: { _like: "/bahrain/bh-piscine/%" } }
                        ]
                        }
                    ) {
                        aggregate {
                            sum {
                                amount
                            }
                        }
                    }  
                    progress {
                        id
                        userId
                        objectId
                        grade
                        createdAt
                        updatedAt
                        path
                    }
                    result {
                        id
                        objectId
                        userId
                        grade
                        type
                        createdAt
                        updatedAt
                        path
                    }
                    object {
                        id
                        name
                        type
                        attrs
                    }
                    recentProj:transaction(
                        where: {
                        type: { _eq: "xp" }
                        _and: [
                            { path: { _like: "/bahrain/bh-module%" } },
                            { path: { _nlike: "/bahrain/bh-module/checkpoint%" } },
                            { path: { _nlike: "/bahrain/bh-module/piscine-js%" } }
                            ]
                        }
                        order_by: { createdAt: desc }
                        limit: 5
                    ) {
                        object {
                            type
                            name
                        }
                    }
                    currProgress:progress(
                        where: { isDone: { _eq: false }, object: { type: { _eq: "project" } } }
                        limit: 1
                        ) {
                        object {
                            name
                        }
                    }
                }
                `
            })
        });

        const result = await response.json();
        const data = result.data;
        const userInfo = result.data.user;
        if (!userInfo.length) {
            window.location.href = 'index.html';
            return;
        }
        if(data.currProgress.length){
            const projectRecents = document.getElementById('currentProjects');
            const recentProject = document.createElement('div'); // Create a new div for each project
            recentProject.textContent = data.currProgress[0].object.name; // Set the text
            projectRecents.appendChild(recentProject); // Append the new div to the container
        }
        for(var i =0; i <data.recentProj.length;i++){
            const projectRecents = document.getElementById('ProjectRecents');
            const recentProject = document.createElement('div'); // Create a new div for each project
            recentProject.textContent = (i + 1) + ". " + data.recentProj[i].object.name; // Set the text
            projectRecents.appendChild(recentProject); // Append the new div to the container
        }
        document.getElementById('userInfo').textContent = `Welcome, ${userInfo[0].login}!`;
        document.getElementById('audits').textContent = userInfo[0].auditRatio.toFixed(1);
        if (data.transaction_aggregate.aggregate.sum.amount != null) {
            if (data.transaction_aggregate.aggregate.sum.amount / 1000 >= 1000) {
                document.getElementById('moduleExp').textContent = "Module - " + ((data.transaction_aggregate.aggregate.sum.amount / 1000) / 1000).toFixed(1) + "MB";
            } else {
                document.getElementById('moduleExp').textContent = "Module - " + (data.transaction_aggregate.aggregate.sum.amount / 1000).toFixed(0) + "KB";
            }
        }
        if (data.js.aggregate.sum.amount != null) {
            if (data.js.aggregate.sum.amount / 1000 >= 1000) {
                document.getElementById('jsExp').textContent = "JS Piscine - " + ((data.js.aggregate.sum.amount / 1000) / 1000).toFixed(1) + "MB";
            } else {
                document.getElementById('jsExp').textContent = "JS Piscine - " + (data.js.aggregate.sum.amount / 1000).toFixed(0) + "KB";
            }
        }
        if (data.go.aggregate.sum.amount != null) {
            if (data.go.aggregate.sum.amount / 1000 >= 1000) {
                document.getElementById('goExp').textContent = "Go Piscine - " + ((data.go.aggregate.sum.amount / 1000) / 1000).toFixed(1) + "MB";
            } else {
                document.getElementById('goExp').textContent = "Go Piscine - " + (data.go.aggregate.sum.amount / 1000).toFixed(0) + "KB";
            }
        }
        document.getElementById('name').innerHTML = "Full Name: " + userInfo[0].attrs["firstName"] + " " + userInfo[0].attrs["lastName"];
        document.getElementById('email').innerHTML = "E-mail: " + userInfo[0].attrs["email"];

        // var image = userInfo[0].attrs["id-cardUploadId"];
        var upAudit = userInfo[0].totalUp / 1000;
        var downAudit = userInfo[0].totalDown / 1000;
        drawGraphs(userInfo, upAudit, downAudit);
        var tfUp = false;
        var tfDown = false;
        if (upAudit >= 1000) {
            upAudit /= 1000;
            tfUp = true;
        }
        if (downAudit >= 1000) {
            downAudit /= 1000;
            tfDown = true;
        }
        if (tfUp) {
            document.getElementById('audit1').textContent = upAudit.toFixed(1) + " MB";
        } else {
            document.getElementById('audit1').textContent = upAudit.toFixed(0) + " KB";
        }
        if (tfDown) {
            document.getElementById('audit2').textContent = downAudit.toFixed(1) + " MB";
        } else {
            document.getElementById('audit2').textContent = downAudit.toFixed(0) + " KB";

        }
    } catch (error) {
        console.error('Error fetching profile:', error);
        window.location.href = 'index.html';
        return;
    }
}

function drawGraphs(userInfo, auditUp, auditDown) {
    const svg1 = document.getElementById('graph1');
    const svg2 = document.getElementById('graph2');
    // Sample SVG graph generation code
    if (auditUp > auditDown) {
        var test = auditDown / auditUp;
        test = 250 * test;
        svg1.innerHTML = `<svg height="10" width="250" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid white;border-radius:5px"><line x1="0" y1="10" x2="250" y2="10" style="stroke:cyan;stroke-width:200;"/></svg>`;
        svg2.innerHTML = `<svg height="10" width="250" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid white;border-radius:5px"><line x1="0" y1="10" x2="${test}" y2="10" style="stroke:white;stroke-width:200;"/></svg>`;
    } else {
        var test = auditUp / auditDown;
        test = 250 * test;
        svg1.innerHTML = `<svg height="10" width="250" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid white;border-radius:5px"><line x1="0" y1="10" x2="${test}" y2="10" style="stroke:white;stroke-width:200;"/></svg>`;
        svg2.innerHTML = `<svg height="10" width="250" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid white;border-radius:5px"><line x1="0" y1="10" x2="250" y2="10" style="stroke:cyan;stroke-width:200;"/></svg>`;

    }
}

function logout() {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
}