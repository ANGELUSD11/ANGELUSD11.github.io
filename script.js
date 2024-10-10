const suscribersNumber = document.querySelector("#contadorsubs");
const channelID = 'UCFYLLqA03vesXUt-3eTP81A'
const APIkey = YOUTUBE_API_KEY = 'AIzaSyDhieh_xHzxX8pjn_joqDJpYs7NHGqnitU'
const proxyUrl = 'https://cors-anywhere.herokuapp.com/https://www.googleapis.com/youtube/v3/channels?part=statistics&id=';

document.addEventListener("DOMContentLoaded", () =>{
    LoadStats();
})

function LoadStats() {
    Promise.all([
        fetch(`${proxyUrl}${channelID}&key=${APIkey}`)
        .then(response => response.json()),
    ]) .then(
        ([youtubeData]) => {
            const subscriberCount = youtubeData.items[0].statistics.subscriberCount;
            suscribersNumber.textContent = parseInt(subscriberCount).toLocaleString() + ' Suscriptores';
        }
    )
}