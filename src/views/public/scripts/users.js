window.onload = async () => {
    const users_container = document.getElementById("users_container");
    const users = await fetch_users();
    console.log('users', users);

    users_container.innerHTML = users
        .map(item => {
            return user_card(item);
        }).join(" ");
};

async function fetch_users() {
    const result = await fetch("/api/users");
    const data = await result.json();
    const users = data.data;
    return users;
}

function user_card(user) {
    return `
            <div class="bg-red-700">
                <div>name : ${user.name}</div>
                <div>email : ${user.email}</div>
            </div>
        `;
}