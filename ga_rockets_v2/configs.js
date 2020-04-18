var configs = [
    {
        name: 'Basic',
        N_POPULATIONS: 1,
        N_INITIAL_SPECIES: 3,
        N_ROCKETS: 50,
        strategy: [
            {p0: 0.05, p1: 0.2, m: 0.001},
            {p0: 0.1,  p1: 0.4, m: 0.005},
            {p0: 0.1,  p1: 0.8, m: 0.01},
            {p0: 0.2,  p1: 1,   m: 0.1}
        ]
    },
    {
        name: 'Elitism',
        N_POPULATIONS: 10,
        N_INITIAL_SPECIES: 3,
        N_ROCKETS: 50,
        strategy: [
            {p0: 0.03, p1: 0.95, m: 0.001},
            {p0: 0.1,  p1: 1,   m: 0.01}
        ]
    },
    {
        name: 'Twitchy',
        N_POPULATIONS: 1,
        N_INITIAL_SPECIES: 5,
        N_ROCKETS: 100,
        ROCKET_SPEED: 80,
        ROCKET_TURN_SPEED: 0.4,
        TOTAL_TICKS: 300,
        TICKS_PER_ALLELE: 1,
        START_FINE_OPTIMISATIONS: 30,
        strategy: [
            {p0: 0.02, p1: 0.9, m: 0.001},
            {p0: 0.1,  p1: 1,   m: 0.01}
        ]
    },
    {
        name: 'Simpler',
        N_POPULATIONS: 3,
        N_INITIAL_SPECIES: 5,
        N_ROCKETS: 100,
        ROCKET_SPEED: 100,
        ROCKET_TURN_SPEED: 0.05,
        TOTAL_TICKS: 200,
        TICKS_PER_ALLELE: 4,
        strategy: [
            {p0: 0.1, p1: 0.5, m: 0.001},
            {p0: 0.1, p1: 1,   m: 0.005}
        ]
    }
];

var obstacle_layouts = [
    {
        name: 'Easy',
        obstacles: [
            0, 200, 80, 10,
            + 120, 300, 60, 10,
            - 120, 300, 60, 10,
            0, 400, 60, 10,
            + 220, 400, 50, 10,
            - 220, 400, 50, 10,
            + 120, 550, 60, 10,
            - 120, 550, 60, 10,
            - 200, 650, 80, 10,
            + 200, 650, 80, 10,
            0, 650, 60, 10
        ]
    },
    {
        name: 'Hard',
        obstacles: [
            0, 150, 80, 10,
            + 120, 250, 60, 10,
            - 120, 250, 60, 10,
            0, 400, 60, 10,
            + 220, 400, 50, 10,
            - 220, 400, 50, 10,
            + 120, 550, 60, 10,
            - 120, 550, 60, 10,
            - 200, 650, 80, 10,
            + 200, 650, 80, 10,
            0, 650, 60, 10
        ]
    },
    {
        name: 'Tunnel',
        obstacles: [
            - 30, 150, 20, 300,
            + 30, 180, 20, 360,
            - 120, 310, 200, 20,
            - 70, 370, 220, 20,
        ]
    },
    {
        name: 'Local Max Trap',
        obstacles: [
            0, 200, 100, 10,
            + 150, 300, 160, 10,
            - 150, 300, 160, 10,
            0, 400, 60, 10
        ]
    },
    {
        name: 'Species Filter',
        obstacles: [
            0, 200, 10, 10,
            - 40, 200, 10, 10,
            + 40, 200, 10, 10,
            - 80, 200, 10, 10,
            + 80, 200, 10, 10,
            0, 300, 10, 40,
            - 40, 300, 10, 40,
            + 40, 300, 10, 40,
            - 80, 300, 10, 40,
            + 80, 300, 10, 40,
        ]
    },
    {
        name: 'Small Grid',
        obstacles: make_grid(40, 8)
    },
    {
        name: 'Large Grid',
        obstacles: make_grid(70, 12)
    }
]

/****************************************************
    HELPER FUNCTIONS
****************************************************/
function make_grid(spacing, size) {
    var obstacles = [];
    for (var i = 0; i < 200; i+=spacing) {
        for (var j = 150; j < 800; j+=spacing) {
            obstacles.push(i,j,size,size);
            if (i != 0) {
                obstacles.push(-i,j,size,size);
            }
        }
    }
    return obstacles
}

/****************************************************
    UI
****************************************************/
document.getElementById('ui').innerHTML += createDropDown('Config', configs);
document.getElementById('ui').innerHTML += createDropDown('Obstacles', obstacle_layouts);

function createDropDown(name, data) {
    var html = [
        '<div class="dropdown">',
        '<button class="dropbtn">'+name+'</button>',
        '<div class="dropdown-content">'
    ];
    for (var i=0; i<data.length; i++) {
        html.push(
            '<p class="dropdown-option" name="'+name+'">'+data[i].name+'</p>'
        );
    }
    html.push('</div></div>');
    return html.join('');
}


document.addEventListener('click', function(e) {
    var options = document.getElementsByClassName("dropdown-option");
    for (i = 0; i < options.length; i++) {
        if (e.target === options[i]) {
            if (e.target.getAttribute('name') === 'Config') {
                set_config(options[i].innerHTML);
            }
            if (e.target.getAttribute('name') === 'Obstacles') {
                set_obstacles(options[i].innerHTML);
            }
        }
    }
});
