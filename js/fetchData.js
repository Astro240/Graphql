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

        const result = await response.json();
        const data = result.data;
        const userInfo = result.data.user;
        if (!userInfo.length) {
            window.location.href = 'index.html';
            return;
        }
        const userSkills = data.progressionSkill[0]?.transactions || [];
        const skillnameAndAmount = getTopSkills(userSkills);
        let arr = [];
        let arrvalues = [];
        for (let i = 0; i < skillnameAndAmount.length; i++) {
            const capitalizedSkillName = skillnameAndAmount[i].name.charAt(0).toUpperCase() + skillnameAndAmount[i].name.slice(1);
            arr.push(capitalizedSkillName);
            arrvalues.push(skillnameAndAmount[i].amount)
        }
        const maxValue = Math.max(...arrvalues);
        arrvalues = arrvalues.map(value => (value / maxValue) * 5);
        console.log(arr)
        console.log(arrvalues); 
        drawSvgRadar(arr, arrvalues);

        if (data.currProgress.length) {
            const projectRecents = document.getElementById('currentProjects');
            const recentProject = document.createElement('div'); // Create a new div for each project
            recentProject.textContent = data.currProgress[0].object.name; // Set the text
            projectRecents.appendChild(recentProject); // Append the new div to the container
        }
        for (var i = 0; i < data.recentProj.length; i++) {
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
        console.error('Error fetching profile:', error);
        window.location.href = 'index.html';
        return;
    }
}

function drawGraphs(userInfo, auditUp, auditDown) {
    const svg1 = document.getElementById('graph1');
    const svg2 = document.getElementById('graph2');
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

function drawSvgRadar(nameData, Pointdata) {
    const data = Pointdata;
    const categories = nameData;
    const numCategories = categories.length;
    const maxValue = 5;
    const radius = 100;
    const angleSlice = (Math.PI * 2) / numCategories;

    const svg = d3.select('#radarChart');

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

    // Draw the data points
    dataPoints.forEach(point => {
        svg.append('circle')
            .attr('cx', point.split(',')[0])
            .attr('cy', point.split(',')[1])
            .attr('class', 'point');
    });
}
function logout() {
    localStorage.removeItem('jwt');
    window.location.href = 'index.html';
}

function getTopSkills(skills) {
    const topSkills = skills.reduce((acc, skill) => {
      const skillType = skill.type.split("_")[1]; // Extract the skill type from the key
      // Check if the skill type exists in the accumulator
      if (acc[skillType]) {
        acc[skillType] += skill.amount;
      } else {
        acc[skillType] = skill.amount;
      }
      return acc;
    }, {}); // Initialize the accumulator as an empty object
  
    // Convert the object into an array of { name: string; amount: number }
    return (
      Object.entries(topSkills)
        // Sort the skills by amount in descending order
        .sort((a, b) => b[1] - a[1])
        .slice(0, 7)
        .map(([name, amount]) => ({ name, amount })) // Map the key-value pairs to the desired format
    );
  }