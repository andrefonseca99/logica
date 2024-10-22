// Fetch new users from API
let newUsers = [];

document.getElementById("fetch-users").onclick = async () => {
  const response = await fetch("/api/users");
  const users = await response.json();

  const newUsersList = document.getElementById("new-users-list");

  users.forEach((user) => {
    let name = user.first_name + " " + user.last_name;
    newUsers.push({
      ID: user.id,
      Name: name,
      Email: user.email,
      Avatar: user.avatar,
    });

    newUsersList.innerHTML += `
              <tr>
                  <td>${user.id}</td>
                  <td><img src="${user.avatar}" class="avatar" alt="Avatar de ${name}" /></td>
                  <td>${name}</td>
                  <td>${user.email}</td>
              </tr>`;
  });

  alert("Novos usuários obtidos com sucesso!");
  document.getElementById("empty-table-message-container").style.display =
    users.length === 0 ? "flex" : "none";
};

// Create users on CSV
document.getElementById("save-new-users").onclick = async () => {
  if (!newUsers.length) {
    alert("Não há novos usuários para salvar!");
    return;
  }
  await fetch("/api/save", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newUsers),
  });

  alert("Usuários salvos com sucesso!");

  newUsers = [];
  document.getElementById("new-users-list").innerHTML = "";
  document.getElementById("empty-table-message-container").style.display =
    "flex";
  fetchAddedUsers();
};

// Read users from CSV
async function fetchAddedUsers() {
  const response = await fetch("/api/read");
  const users = await response.json();

  const userList = document.getElementById("user-list");
  userList.innerHTML = "";

  users.forEach((user) => {
    userList.innerHTML += `
              <tr id="user-row-${user.ID}">
                  <td>${user.ID}</td>
                  <td><img src="${user.Avatar}" class="avatar" alt="Avatar de ${user.Name}" /></td>
                  <td><span id="name-${user.ID}">${user.Name}</span><input class="input-element" id="input-name-${user.ID}" type="text" style="display:none;" value="${user.Name}" /></td>
                  <td><span id="email-${user.ID}">${user.Email}</span><input class="input-element" id="input-email-${user.ID}" type="text" style="display:none;" value="${user.Email}" /></td>
                  <td>
                      <button id="edit-btn-${user.ID}" onclick="editUser('${user.ID}', '${user.Avatar}')" >✏️</button>
                      <button id="save-btn-${user.ID}" style="display:none;" onclick="saveEditedUser('${user.ID}')" class="save-edit-button">✔️</button>
                      <button onclick="confirmDeleteUser('${user.ID}')" class="delete-button">🗑️</button>
                  </td>
              </tr>`;
  });
}

// Fetch added users on page load
document.addEventListener("DOMContentLoaded", fetchAddedUsers);

// Update user on CSV
function editUser(userId) {
  document.getElementById(`name-${userId}`).style.display = "none";
  document.getElementById(`email-${userId}`).style.display = "none";
  document.getElementById(`input-name-${userId}`).style.display = "inline";
  document.getElementById(`input-email-${userId}`).style.display = "inline";

  document.getElementById(`edit-btn-${userId}`).style.display = "none";
  document.getElementById(`save-btn-${userId}`).style.display = "inline";
}

async function saveEditedUser(userId) {
  const newName = document.getElementById(`input-name-${userId}`).value;
  const newEmail = document.getElementById(`input-email-${userId}`).value;

  const response = await fetch(`/api/edit/${userId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      Name: newName,
      Email: newEmail,
      Avatar: document.getElementById(`user-row-${userId}`).querySelector("img")
        .src,
    }),
  });

  if (response.status !== 200) {
    alert("Erro ao editar usuário!");
    return;
  } else if (response.status === 200) {
    await fetchAddedUsers();
    alert("Usuário editado com sucesso!");
  }
}

// Delete user from CSV
function confirmDeleteUser(userId) {
  const confirmation = confirm(
    "Tem certeza de que deseja excluir este usuário?"
  );
  if (confirmation) {
    deleteUser(userId);
  }
}

async function deleteUser(userId) {
  await fetch(`/api/delete/${userId}`, {
    method: "DELETE",
  });

  alert("Usuário excluído com sucesso!");

  fetchAddedUsers();
}

document.getElementById("delete-all-added-users").onclick = async () => {
  const response = await fetch("/api/clear", {
    method: "DELETE",
  });
  const data = await response.json();

  alert(data.message);
  fetchAddedUsers();
};

// Accordion
const accordions = document.getElementsByClassName("accordion");
for (let i = 0; i < accordions.length; i++) {
  accordions[i].onclick = function () {
    this.classList.toggle("active");
    const content = this.nextElementSibling;
    content.style.display = content.style.display === "none" ? "block" : "none";

    const chevron = this.querySelector(".chevron");
    chevron.textContent = content.style.display === "block" ? "▲" : "▼";
  };
}

// Search functions
document.getElementById("search-button").onclick = async () => {
  const searchTerm = document.getElementById("search-term").value;

  const response = await fetch(
    `/api/search?term=${encodeURIComponent(searchTerm)}`
  );

  if (response.ok) {
    const users = await response.json();
    displayUsers(users);
  } else {
    alert("Erro ao buscar usuários!");
  }
};

function displayUsers(users) {
  const userList = document.getElementById("user-list");
  userList.innerHTML = "";

  users.forEach((user) => {
    userList.innerHTML += `
        <tr id="user-row-${user.ID}">
          <td>${user.ID}</td>
          <td><img src="${user.Avatar}" class="avatar" alt="Avatar de ${user.Name}" /></td>
          <td><span id="name-${user.ID}">${user.Name}</span></td>
          <td><span id="email-${user.ID}">${user.Email}</span></td>
          <td>
            <button id="edit-btn-${user.ID}" onclick="editUser('${user.ID}', '${user.Avatar}')" >✏️</button>
            <button id="save-btn-${user.ID}" style="display:none;" onclick="saveEditedUser('${user.ID}')" class="save-edit-button">✔️</button>
            <button onclick="confirmDeleteUser('${user.ID}')" class="delete-button">🗑️</button>
          </td>
        </tr>`;
  });
}

document.getElementById("clear-search").onclick = () => {
  document.getElementById("search-term").value = "";
  fetchAddedUsers();
};
