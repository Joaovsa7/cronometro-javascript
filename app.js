const $input = document.querySelector('input');
const $botaoIniciar = document.querySelector('#iniciar');
const $botaoResetar = document.querySelector('#resetar');
const $avisoContainer = document.querySelector('.aviso-container');
const eventoContagemIniciada = new Event('contagemIniciada');
const eventoContagemParada = new Event('contagemPausada');

const UM_SEGUNDO = 1000;

const state = {
    minutos: null,
    segundos: null,
    contando: false,
}

function resetarEstado() {
    state.minutos = null;
    state.segundos = null;
    state.contando = false;
    return state;
}

async function avisaQueChegouAoFim() {
    const serviceWorkerRegistro = await navigator.serviceWorker.getRegistration();
    const options = {
        body: 'O tempo que você cronometrou chegou ao fim!',
    };

    return serviceWorkerRegistro.showNotification('O cronômetro parou!', options);
}

function cronometraSegundos(state) {
    const appState = state;
    const contador = setInterval(() => {
        if (!state.contando) return clearInterval(contador);
        if (appState.segundos === 0) {
            $botaoResetar.classList.remove('visivel');
            $botaoIniciar.classList.remove('small');
            $botaoIniciar.disabled = false;
            $botaoIniciar.classList.remove('parar');
            $botaoIniciar.textContent = 'Iniciar';
            appState.contando = false;
            avisaQueChegouAoFim();
            return clearInterval(state.contador);
        }
        appState.segundos--;
        return atualizaValor(appState.segundos);
    }, UM_SEGUNDO);
    return contador;
};

function cronometraMinutosEsegundos(state) {
    const appState = state;
    const contador = setInterval(() => {
        if (!state.contando) {
            return clearInterval(contador);
        }

        if (appState.minutos == 0 && appState.segundos == 0) {
            $botaoResetar.classList.remove('visivel');
            $botaoIniciar.classList.remove('small');
            $botaoIniciar.classList.remove('parar');
            $botaoIniciar.textContent = 'Iniciar';
            state.contando = false;
            avisaQueChegouAoFim();
            return clearInterval(state.contador);
        }

        if (appState.segundos === 0) {
            appState.minutos--;
            appState.segundos = 60;
            atualizaValor(state.segundos);
        }

        appState.segundos--;
        return atualizaValor(`${appState.minutos}:${appState.segundos}`);
    }, UM_SEGUNDO);
    return contador;
};

function resetaEstado() {
    document.dispatchEvent(eventoContagemParada);
    state.contando = false;
    atualizaValor(00, 00);
    return resetarEstado();
}

function mostraAviso(mensagem) {
    $avisoContainer.classList.add('visivel');
    $avisoContainer.firstChild.textContent = mensagem;
    setTimeout(() => {
        $avisoContainer.classList.remove('visivel');
        $avisoContainer.children.textContent = undefined;
    }, 3000);
}

function atualizaValor(value) {
    $input.value = value;
}

function iniciaCronometro() {
    if (state.contando) {
        state.contando = false;
        document.dispatchEvent(eventoContagemParada);
        return false;
    }

    const hasValue = Object.values(state).some(Boolean);
    if (!hasValue) {
        return mostraAviso('Você precisa inserir algum valor.');
    };

    document.dispatchEvent(eventoContagemIniciada);

    const POSSUI_MINUTOS = state.minutos != null && state.minutos > 0;

    if (POSSUI_MINUTOS) {
        return cronometraMinutosEsegundos(state);
    }

    return cronometraSegundos(state);
}

function manipulaMudancas({ target }) {
    target.value = target.value.replace(/[A-Z-a-z]/gi, '')
        .replace(/(\d{2})(\d)/, '$1:$2');
}

function manipulaDesfoque({ target }) {
    const value = target.value;
    if (!value) return;
    const regex = /(?<minutos>.+\d).(?<segundos>.+)|(?<apenasSegundos>.+)/;
    const { groups } = value.match(regex);
    const { minutos, segundos, apenasSegundos } = groups;
    if (minutos && segundos) {
        state.minutos = parseInt(minutos);
        state.segundos = parseInt(segundos);
        return;
    }
    state.segundos = parseInt(apenasSegundos);
}

function iniciarContagem() {
    state.contando = true;
    $botaoIniciar.innerText = 'Parar';
    $botaoIniciar.classList.add('small');
    $botaoIniciar.classList.add('parar');
    $botaoResetar.classList.add('visivel');
}

function pararContagem() {
    state.contando = false;
    $botaoResetar.classList.remove('visivel');
    $botaoIniciar.innerText = 'Iniciar';
    $botaoIniciar.classList.remove('small');
    $botaoIniciar.classList.remove('parar');
}

$input.addEventListener('blur', manipulaDesfoque);
$input.addEventListener('input', manipulaMudancas);
$botaoIniciar.addEventListener('click', iniciaCronometro);
$botaoResetar.addEventListener('click', resetaEstado);
document.addEventListener('contagemIniciada', iniciarContagem);
document.addEventListener('contagemPausada', pararContagem);
