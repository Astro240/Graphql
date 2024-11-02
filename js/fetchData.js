document.addEventListener('DOMContentLoaded', async () => {
    await fetchProfile(); //call the function onload
});
//function to get the data and display
async function fetchProfile() {
    const token = localStorage.getItem('jwt'); //get the token from the local storage
    //if the token was invalid or empty then go back to index
    if (!token) {
        window.location.href = 'index.html';
        return;
    }
    //try block to make sure there isnt an error
    try {
        const response = await fetch('https://learn.reboot01.com/api/graphql-engine/v1/graphql', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({//query all the information needed from the user
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
                    progressionSkill:user {
                        transactions(where: {
                        type: {_ilike: "%skill%"}
                        }
                    ) {
                        type
                        amount
                    }
                    }
                }
                `
            })
        });

        const result = await response.json(); //result variable that has the json data
        const data = result.data; //easier access to data
        const userInfo = result.data.user; //userinfo to grab
        //if there was no user logged in
        if (!userInfo.length) {
            window.location.href = 'index.html'; //redirect to login
            return;
        }
        const userSkills = data.progressionSkill[0]?.transactions || []; //user skills
        const skillnameAndAmount = getTopSkills(userSkills); //this is to get the top 7 skills of the user
        let arr = []; //empty array to input the names of the skills
        let arrvalues = []; //empty array to input the value of the skills
        for (let i = 0; i < skillnameAndAmount.length; i++) {
            if (skillnameAndAmount[i].name.length >= 2) { //insurance for no error
                const capitalizedSkillName = skillnameAndAmount[i].name.charAt(0).toUpperCase() + skillnameAndAmount[i].name.slice(1); //get the skill and 
                arr.push(capitalizedSkillName);//push the name
                arrvalues.push(skillnameAndAmount[i].amount); //push the amount
            }
        }
        const maxValue = Math.max(...arrvalues); //get the max of the array value
        arrvalues = arrvalues.map(value => (value / maxValue) * 5);
        drawSvgRadar(arr, arrvalues);//draw the svg radar

        if (data.currProgress.length) {
            const projectRecents = document.getElementById('currentProjects');
            const recentProject = document.createElement('div');
            recentProject.textContent = data.currProgress[0].object.name;
            projectRecents.appendChild(recentProject);
        }
        for (var i = 0; i < data.recentProj.length; i++) {
            const projectRecents = document.getElementById('ProjectRecents');
            const recentProject = document.createElement('div');
            recentProject.textContent = (i + 1) + ". " + data.recentProj[i].object.name;
            projectRecents.appendChild(recentProject);
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
        document.getElementById('phoneNum').innerHTML = "Phone Number: " + userInfo[0].attrs["Phone"];
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
            document.getElementById('audit1').textContent = upAudit.toFixed(2) + " MB";
        } else {
            document.getElementById('audit1').textContent = upAudit.toFixed(0) + " KB";
        }
        if (tfDown) {
            document.getElementById('audit2').textContent = downAudit.toFixed(2) + " MB";
        } else {
            document.getElementById('audit2').textContent = downAudit.toFixed(0) + " KB";

        }
    } catch (error) {
        console.error('Error fetching profile:', error); //write the error onto the console
        window.location.href = 'index.html'; //redirect to login page
        return;
    }
}

function drawGraphs(userInfo, auditUp, auditDown) {
    const svg1 = document.getElementById('graph1');
    const svg2 = document.getElementById('graph2');
    if (auditUp > auditDown) {
        var test = auditDown / auditUp;
        test = 100 * test;
        svg1.innerHTML = `<svg height="10" width="65%" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid white;border-radius:5px"><line x1="0" y1="10" x2="100%" y2="10" style="stroke:cyan;stroke-width:200;"/></svg>`;
        svg2.innerHTML = `<svg height="10" width="65%" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid white;border-radius:5px"><line x1="0" y1="10" x2="${test}%" y2="10" style="stroke:white;stroke-width:200;"/></svg>`;
    } else {
        var test = auditUp / auditDown;
        test = 100 * test;
        svg1.innerHTML = `<svg height="10" width="65%" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid white;border-radius:5px"><line x1="0" y1="10" x2="${test}%" y2="10" style="stroke:white;stroke-width:200;"/></svg>`;
        svg2.innerHTML = `<svg height="10" width="65%" xmlns="http://www.w3.org/2000/svg" style="border: 1px solid white;border-radius:5px"><line x1="0" y1="10" x2="100%" y2="10" style="stroke:cyan;stroke-width:200;"/></svg>`;
    }
}

function drawSvgRadar(nameData, Pointdata) {
    const data = Pointdata;
    const categories = nameData;
    const numCategories = categories.length;
    const maxValue = 5;
    const radius = 100;
    const angleSlice = (Math.PI * 2) / numCategories;

    const svg = d3.select('#radarChart');
    svg.attr('viewBox', '0 -20 200 250');
    for (let r = 1; r <= maxValue; r++) {
        const points = [];
        for (let i = 0; i < numCategories; i++) {
            const x = radius * (r / maxValue) * Math.cos(angleSlice * i - Math.PI / 2);
            const y = radius * (r / maxValue) * Math.sin(angleSlice * i - Math.PI / 2);
            points.push(`${x + radius},${y + radius}`);
        }
        svg.append('polygon')
            .attr('points', points.join(' '))
            .attr('class', 'grid');
    }

    for (let i = 0; i < numCategories; i++) {
        const x = radius * Math.cos(angleSlice * i - Math.PI / 2);
        const y = radius * Math.sin(angleSlice * i - Math.PI / 2);
        svg.append('line')
            .attr('x1', radius)
            .attr('y1', radius)
            .attr('x2', x + radius)
            .attr('y2', y + radius)
            .attr('stroke', '#ccc');
    }

    const dataPoints = data.map((value, i) => {
        const x = radius * (value / maxValue) * Math.cos(angleSlice * i - Math.PI / 2);
        const y = radius * (value / maxValue) * Math.sin(angleSlice * i - Math.PI / 2);
        return `${x + radius},${y + radius}`;
    });

    svg.append('polygon')
        .attr('points', dataPoints.join(' '))
        .attr('class', 'area');

    dataPoints.forEach(point => {
        svg.append('circle')
            .attr('cx', point.split(',')[0])
            .attr('cy', point.split(',')[1])
            .attr('class', 'point');
    });

    categories.forEach((category, i) => {
        const labelX = radius * 1.1 * Math.cos(angleSlice * i - Math.PI / 2);
        const labelY = radius * 1.1 * Math.sin(angleSlice * i - Math.PI / 2);
        svg.append('text')
            .attr('x', labelX + radius)
            .attr('y', labelY + radius)
            .attr('class', 'label')
            .text(category)
            .attr('fill', 'white')
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle');
    });
}
function logout() {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
}

function getTopSkills(skills) {
    if (!Array.isArray(skills)) {
        console.error("Expected an array of skills.");
        return [];
    }
    const topSkills = skills.reduce((acc, skill) => {
        if (typeof skill === 'object' && skill !== null && 'type' in skill && 'amount' in skill) {
            const skillType = skill.type.split("_")[1];
            if (typeof skillType === 'string' && !isNaN(skill.amount)) {
                if (acc[skillType]) {
                    acc[skillType] += skill.amount;
                } else {
                    acc[skillType] = skill.amount;
                }
            }
        }
        return acc;
    }, {});
    const sortedSkills = Object.entries(topSkills).sort((a, b) => b[1] - a[1]);
    return sortedSkills
        .slice(0, Math.min(7, sortedSkills.length))
        .map(([name, amount]) => ({ name, amount }));
}