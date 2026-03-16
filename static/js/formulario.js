const form = document.getElementById("resgateForm");
const steps = Array.from(document.querySelectorAll(".form-step"));
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const submitBtn = document.getElementById("submitBtn");
const progressFill = document.getElementById("progressFill");
const currentStepLabel = document.getElementById("currentStepLabel");
const currentStepName = document.getElementById("currentStepName");
const toggleAllBtn = document.getElementById("toggleAllBtn");
const summaryBox = document.getElementById("summaryBox");
const checklistContainer = document.getElementById("checklistContainer");

let currentStep = 1;
let showAll = false;

const stepNames = {
  1: "Identificação",
  2: "Resgate",
  3: "Recebimento",
  4: "Regras",
  5: "Confirmação"
};

const bankList = {
  "001": "Banco do Brasil",
  "104": "Caixa Econômica Federal",
  "237": "Bradesco",
  "341": "Itaú",
  "033": "Santander",
  "260": "Nubank",
  "077": "Banco Inter",
  "756": "Sicoob",
  "748": "Sicredi",
  "422": "Banco Safra",
  "208": "BTG Pactual",
  "336": "C6 Bank",
  "212": "Banco Original",
  "041": "Banrisul",
  "004": "Banco do Nordeste"
};

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

function formatarTituloSimples(texto) {
    return texto
        .toLowerCase()
        .split(" ")
        .filter(parte => parte.trim() !== "")
        .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
        .join(" ");
}

function formatarNomePessoa(texto) {
    const excecoes = ["da", "de", "do", "das", "dos", "e"];

    return texto
        .toLowerCase()
        .split(" ")
        .filter(parte => parte.trim() !== "")
        .map((parte, index) => {
            if (index > 0 && excecoes.includes(parte)) {
                return parte;
            }
            return parte.charAt(0).toUpperCase() + parte.slice(1);
        })
        .join(" ");
}

function applyNumericOnly(input, maxLength = null) {
  if (!input) return;
  input.addEventListener("input", () => {
    let value = digitsOnly(input.value);
    if (maxLength) value = value.slice(0, maxLength);
    input.value = value;
  });
}

function formatCpfCnpj(value) {
  const digits = digitsOnly(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function applyCpfCnpjMask(input) {
  if (!input) return;
  input.addEventListener("input", () => {
    input.value = formatCpfCnpj(input.value);
  });
}

function isValidCpfCnpjLength(value) {
  const len = digitsOnly(value).length;
  return len === 11 || len === 14;
}

function setElementRequired(el, required) {
  if (!el) return;
  if (required) {
    el.setAttribute("required", "required");
  } else {
    el.removeAttribute("required");
    el.classList.remove("invalid");
  }
}

function updateCreditoRequirements(prefix, active) {
  const bancoSelect = document.getElementById(`${prefix}_banco_select`);
  const bancoCodigo = document.getElementById(`${prefix}_numero`);
  const agencia = document.getElementById(`${prefix}_agencia`);
  const conta = document.getElementById(`${prefix}_conta`);
  const nome = document.getElementById(`${prefix}_nome`);
  const cpfCnpj = document.getElementById(`${prefix}_cpf_cnpj`);
  const outroNome = document.getElementById(`${prefix}_outro_banco_nome`);
  const outroNumero = document.getElementById(`${prefix}_outro_banco_numero`);

  const tipoContaSelecionado = !!getCheckedValue(`${prefix}_tipo_conta`);
  const valorTipoSelecionado = !!getCheckedValue(`${prefix}_valor_tipo`);
  const tipoConta = getCheckedValue(`${prefix}_tipo_conta`);
  const valorTipo = getCheckedValue(`${prefix}_valor_tipo`);
  const isOutroBanco = bancoSelect?.value === "outro";

  setElementRequired(bancoSelect, active);
  setElementRequired(agencia, active);
  setElementRequired(conta, active);
  setElementRequired(nome, active);
  setElementRequired(cpfCnpj, active);

  setRadioGroupRequired(`${prefix}_tipo_conta`, active);
  setRadioGroupRequired(`${prefix}_valor_tipo`, active);

  setElementRequired(document.getElementById(`${prefix}_variacao`), active && tipoConta === "poupanca");

  setElementRequired(document.getElementById(`${prefix}_valor_fixo`), active && valorTipo === "fixo");
  setElementRequired(document.getElementById(`${prefix}_valor_parcial`), active && valorTipo === "parcial");
  setElementRequired(document.getElementById(`${prefix}_percentual`), active && valorTipo === "percentual");

  setElementRequired(outroNome, active && isOutroBanco);
  setElementRequired(outroNumero, active && isOutroBanco);

  if (bancoCodigo) {
    setElementRequired(bancoCodigo, active && !isOutroBanco);
  }

  if (!active) {
    [
      `${prefix}_numero`,
      `${prefix}_agencia`,
      `${prefix}_conta`,
      `${prefix}_nome`,
      `${prefix}_cpf_cnpj`,
      `${prefix}_variacao`,
      `${prefix}_valor_fixo`,
      `${prefix}_valor_parcial`,
      `${prefix}_percentual`,
      `${prefix}_outro_banco_nome`,
      `${prefix}_outro_banco_numero`
    ].forEach(clearField);

    clearRadioGroup(`${prefix}_tipo_conta`);
    clearRadioGroup(`${prefix}_valor_tipo`);
  }
}

function getCheckedValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : "";
}

function toggleHidden(el, hidden) {
  if (!el) return;
  el.classList.toggle("hidden", hidden);
}

function setFieldRequired(fieldId, required) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  if (required) {
    el.setAttribute("required", "required");
  } else {
    el.removeAttribute("required");
    el.classList.remove("invalid");
  }
}

function clearField(fieldId) {
  const el = document.getElementById(fieldId);
  if (!el) return;
  if (el.type === "checkbox" || el.type === "radio") {
    el.checked = false;
  } else {
    el.value = "";
  }
  el.classList.remove("invalid");
}

function clearRadioGroup(name) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
    radio.checked = false;
    radio.classList.remove("invalid");
  });
}

function setRadioGroupRequired(name, required) {
  document.querySelectorAll(`input[name="${name}"]`).forEach((radio) => {
    if (required) {
      radio.setAttribute("required", "required");
    } else {
      radio.removeAttribute("required");
      radio.classList.remove("invalid");
    }
  });
}

function fillBankCode(selectId, codeId, otherWrapId, otherNameId, otherCodeId) {
  const select = document.getElementById(selectId);
  const code = document.getElementById(codeId);
  const otherWrap = document.getElementById(otherWrapId);
  const codeFieldWrap = code?.closest(".field");

  if (!select || !code) return;

  if (select.value === "outro") {
    toggleHidden(otherWrap, false);
    toggleHidden(codeFieldWrap, true);
    code.value = "";
    code.readOnly = false;
    setFieldRequired(otherNameId, true);
    setFieldRequired(otherCodeId, true);
    setFieldRequired(codeId, false);
  } else {
    toggleHidden(otherWrap, true);
    toggleHidden(codeFieldWrap, false);
    clearField(otherNameId);
    clearField(otherCodeId);
    setFieldRequired(otherNameId, false);
    setFieldRequired(otherCodeId, false);
    code.value = select.value || "";
    code.readOnly = true;
  }
}

function updateContaJudicial() {
  const possui = getCheckedValue("possui_conta_judicial");
  const wrap = document.getElementById("blocoContasJudiciais");
  const required = possui === "sim";

  toggleHidden(wrap, !required);

  ["conta_judicial_1", "conta_judicial_2", "conta_judicial_3"].forEach((id, index) => {
    setFieldRequired(id, false);
    if (!required) clearField(id);
    if (required && index === 0) setFieldRequired(id, true);
  });
}

function updateFormaRecebimento() {
  const forma = getCheckedValue("forma_recebimento");
  const subcreditoWrap = document.getElementById("blocoSubcredito");
  const blocoCreditoBeneficiario = document.getElementById("blocoCreditoBeneficiario");
  const blocoCreditoRepresentante = document.getElementById("blocoCreditoRepresentante");
  const blocoEspecie = document.getElementById("blocoEspecie");
  const prefixoOutraUf = document.getElementById("prefixo_outra_uf");

  toggleHidden(subcreditoWrap, forma !== "credito");
  toggleHidden(blocoEspecie, forma !== "especie");

  setRadioGroupRequired("credito_destino", forma === "credito");
  setElementRequired(prefixoOutraUf, false);

  if (forma !== "credito") {
    clearRadioGroup("credito_destino");
    toggleHidden(blocoCreditoBeneficiario, true);
    toggleHidden(blocoCreditoRepresentante, true);
    updateCreditoRequirements("cb", false);
    updateCreditoRequirements("cr", false);
  } else {
    const destino = getCheckedValue("credito_destino");
    const showCb = destino === "beneficiario" || destino === "ambos";
    const showCr = destino === "representante" || destino === "ambos";

    toggleHidden(blocoCreditoBeneficiario, !showCb);
    toggleHidden(blocoCreditoRepresentante, !showCr);

    updateCreditoRequirements("cb", showCb);
    updateCreditoRequirements("cr", showCr);
  }

  if (forma !== "especie") {
    clearField("prefixo_outra_uf");
  }
}

function updateTipoConta(prefix) {
  const tipo = getCheckedValue(`${prefix}_tipo_conta`);
  const wrap = document.getElementById(`${prefix}_variacao_wrap`);
  const fieldId = `${prefix}_variacao`;
  const bancoSelect = document.getElementById(`${prefix}_banco_select`);

  const isPoupanca = tipo === "poupanca";
  const isBancoDoBrasil = bancoSelect?.value === "001";
  const mostrarVariacao = isPoupanca && isBancoDoBrasil;

  toggleHidden(wrap, !mostrarVariacao);
  setFieldRequired(fieldId, mostrarVariacao);

  if (!mostrarVariacao) {
    clearField(fieldId);
  }
}

function updateTipoValor(prefix) {
  const tipo = getCheckedValue(`${prefix}_valor_tipo`);
  const wrap = document.getElementById(`${prefix}_valor_campos`);

  const fieldMap = {
    fixo: `${prefix}_valor_fixo`,
    parcial: `${prefix}_valor_parcial`,
    percentual: `${prefix}_percentual`
  };

  toggleHidden(wrap, tipo === "total" || !tipo);

  Object.entries(fieldMap).forEach(([key, fieldId]) => {
    const fieldWrap = document.getElementById(`${fieldId}_wrap`);
    const active = tipo === key;
    toggleHidden(fieldWrap, !active);
    setFieldRequired(fieldId, active);
    if (!active) clearField(fieldId);
  });
}

function formatMoneyBR(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  const number = parseInt(digits, 10) / 100;

  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function applyMoneyMask(input) {
  if (!input) return;

  input.addEventListener("input", () => {
    input.value = formatMoneyBR(input.value);
  });
}

function formatCurrencyDigits(value) {
  const digits = String(value || "").replace(/\D/g, "");

  if (!digits) return "";

  const number = parseInt(digits, 10) / 100;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function applyCurrencyMask(input) {
  if (!input) return;

  input.addEventListener("input", () => {
    input.value = formatCurrencyDigits(input.value);
  });
}

function updateDivisaoCreditoAlert() {
  const destino = getCheckedValue("credito_destino");
  const cbTipo = getCheckedValue("cb_valor_tipo");
  const crTipo = getCheckedValue("cr_valor_tipo");
  const alerta = document.getElementById("alertaDivisaoCreditoFooter");

  const invalido = destino === "ambos" && cbTipo === "total" && crTipo === "total";

  if (!alerta) return !invalido;

  alerta.textContent =
    "Quando o crédito é dividido entre beneficiário e representante, apenas um deles recebe o saldo remanescente. O outro deve informar valor fixo, parcial ou percentual.";

  toggleHidden(alerta, !invalido);

  return !invalido;
}

function updateIR() {
  const tipoResgate = getCheckedValue("tipo_resgate");
  const isento = getCheckedValue("isento_ir");
  const blocoIR = document.getElementById("blocoIR");
  const alertaIR = document.getElementById("alertaIR");

  const visible = tipoResgate === "precatorio_federal";
  toggleHidden(blocoIR, !visible);

  if (!visible) {
    clearRadioGroup("isento_ir");
  }

  toggleHidden(alertaIR, !(visible && isento === "sim"));
}

function updateAnalfabeto() {
  const analfabeto = getCheckedValue("beneficiario_analfabeto");
  const alerta = document.getElementById("alertaAnalfabeto");
  toggleHidden(alerta, analfabeto !== "sim");
}

function updateRepresentacao() {
  const representanteNome = document.getElementById("representante_nome")?.value.trim() || "";
  const representanteDoc = document.getElementById("representante_cpf_cnpj")?.value.trim() || "";
  const forma = getCheckedValue("forma_recebimento");
  const destino = getCheckedValue("credito_destino");
  const alerta = document.getElementById("alertaProcuracao");

  const show = !!representanteNome || !!representanteDoc || (forma === "credito" && (destino === "representante" || destino === "ambos"));
  toggleHidden(alerta, !show);
}

function updateChecklist() {
  const itens = [];
  const tipoResgate = getCheckedValue("tipo_resgate");
  const forma = getCheckedValue("forma_recebimento");
  const destino = getCheckedValue("credito_destino");
  const isento = getCheckedValue("isento_ir");
  const analfabeto = getCheckedValue("beneficiario_analfabeto");
  const possuiConta = getCheckedValue("possui_conta_judicial");
  const representanteNome = document.getElementById("representante_nome")?.value.trim() || "";
  const representanteDoc = document.getElementById("representante_cpf_cnpj")?.value.trim() || "";

  itens.push("Conferir se os dados informados coincidem com o documento de levantamento.");

  if (representanteNome || representanteDoc || (forma === "credito" && (destino === "representante" || destino === "ambos"))) {
    itens.push("Conferir a documentação de representação e os poderes específicos, quando exigíveis.");
  }

  if (tipoResgate === "precatorio_federal" && isento === "sim") {
    itens.push("Revisar a documentação relacionada à declaração de isenção.");
  }

  if (forma === "credito" && (destino === "beneficiario" || destino === "ambos")) {
    itens.push("Conferir os dados bancários do beneficiário. O crédito é vedado a terceiros.");
  }

  if (forma === "credito" && (destino === "representante" || destino === "ambos")) {
    itens.push("Conferir os dados bancários do representante legal. O crédito é vedado a terceiros.");
  }

  if (forma === "especie") {
    itens.push("Para saque em outra UF, informe o prefixo da agência.");
  }

  if (analfabeto === "sim") {
    itens.push("O fluxo online não substitui as exigências presenciais com testemunhas e formalidades aplicáveis.");
  }

  checklistContainer.innerHTML = `
    <strong>Pontos de atenção:</strong>
    <ul>
      ${itens.map((item) => `<li>${item}</li>`).join("")}
    </ul>
  `;
}

function updateSummary() {
  const beneficiario = document.getElementById("beneficiario_nome")?.value.trim() || "Não informado";
  const doc = document.getElementById("beneficiario_cpf_cnpj")?.value.trim() || "Não informado";

  const representante = document.getElementById("representante_nome")?.value.trim() || "";
  const representanteDoc = document.getElementById("representante_cpf_cnpj")?.value.trim() || "";

  const tipoResgateMap = {
    estadual: "Depósito Estadual",
    trabalhista: "Depósito Trabalhista",
    precatorio_federal: "Precatório ou RPV Federal"
  };

  const formaRecebimentoMap = {
    autorizacao_permanente: "Autorização permanente para crédito em conta do beneficiário no Banco do Brasil",
    convenio_djc: "Convênio de resgate centralizado",
    credito: "Crédito em Conta BB ou TED",
    especie: "Pagamento em espécie"
  };

  const destinoMap = {
    beneficiario: "Beneficiário",
    representante: "Representante",
    ambos: "Beneficiário e Representante"
  };

  const tipoResgate = tipoResgateMap[getCheckedValue("tipo_resgate")] || "Não selecionado";
  const formaSelecionada = getCheckedValue("forma_recebimento");
  const forma = formaRecebimentoMap[formaSelecionada] || "Não selecionada";
  const destino = destinoMap[getCheckedValue("credito_destino")] || "";
  const local = document.getElementById("local")?.value.trim() || "Não informado";
  const dataRaw = document.getElementById("data")?.value || "";

  let dataFormatada = "Não informada";
  if (dataRaw) {
    const [ano, mes, dia] = dataRaw.split("-");
    if (ano && mes && dia) {
      dataFormatada = `${dia}-${mes}-${ano}`;
    }
  }

  const representanteHtml = (representante || representanteDoc)
    ? `
      <strong>Representante legal:</strong><br>
      ${representante || "Não informado"}<br>
      <strong>CPF/CNPJ do representante:</strong><br>
      ${representanteDoc || "Não informado"}<br><br>
    `
    : "";

  summaryBox.innerHTML = `
    <strong>Beneficiário:</strong><br>
    ${beneficiario}<br>
    <strong>CPF/CNPJ:</strong><br>
    ${doc}<br><br>

    ${representanteHtml}

    <strong>Esfera:</strong><br>
    ${tipoResgate}<br><br>

    <strong>Resgate:</strong><br>
    ${forma}${formaSelecionada === "credito" && destino ? `<br>${destino}` : ""}<br><br>

    <strong>Local:</strong><br>
    ${local}<br>
    <strong>Data:</strong><br>
    ${dataFormatada}
  `;
}

function clearValidationState(step) {
  step.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
  step.querySelectorAll(".field-error").forEach((el) => el.remove());
  const stepError = step.querySelector(".step-error-box");
  if (stepError) stepError.remove();
}

function appendFieldError(container, message) {
  if (!container) return;
  const exists = container.querySelector(".field-error");
  if (exists) return;
  const div = document.createElement("div");
  div.className = "field-error";
  div.textContent = message;
  container.appendChild(div);
}

function validateStep(stepNumber) {
  const step = document.querySelector(`.form-step[data-step="${stepNumber}"]`);
  if (!step) return true;

  clearValidationState(step);

  let valid = true;
  let firstInvalid = null;

  const visibleFields = Array.from(
    step.querySelectorAll("input, select, textarea")
  ).filter((field) => field.offsetParent !== null);

  // Validação específica da etapa 3: divisão entre beneficiário e representante
  if (stepNumber === 3) {
    const destino = getCheckedValue("credito_destino");
    const cbTipo = getCheckedValue("cb_valor_tipo");
    const crTipo = getCheckedValue("cr_valor_tipo");

    if (destino === "ambos" && cbTipo === "total" && crTipo === "total") {
      valid = false;

      const alerta = document.getElementById("alertaDivisaoCreditoFooter");
      if (alerta) {
        alerta.textContent =
          "Quando o crédito for dividido entre beneficiário e representante, apenas um deles pode receber o total ou saldo remanescente. O outro deve informar valor fixo, parcial ou percentual.";
        toggleHidden(alerta, false);
      }

      const cbRadios = document.querySelectorAll('input[name="cb_valor_tipo"]');
      const crRadios = document.querySelectorAll('input[name="cr_valor_tipo"]');

      cbRadios.forEach((radio) => radio.classList.add("invalid"));
      crRadios.forEach((radio) => radio.classList.add("invalid"));

      if (!firstInvalid) {
        firstInvalid = cbRadios[0] || crRadios[0];
      }
    }
  }

  // Validação específica da etapa 8: celular obrigatório e válido
  if (stepNumber === 8) {
    const celular = document.getElementById("celular");

    if (celular && celular.offsetParent !== null) {
      const valorCelular = celular.value.trim();

      if (!valorCelular) {
        valid = false;
        celular.classList.add("invalid");
        const container = celular.closest(".field") || celular.parentElement;
        appendFieldError(container, "Informe o celular para contato.");
        if (!firstInvalid) firstInvalid = celular;
      } else if (!isValidPhone(valorCelular)) {
        valid = false;
        celular.classList.add("invalid");
        const container = celular.closest(".field") || celular.parentElement;
        appendFieldError(container, "Informe um número com DDD válido.");
        if (!firstInvalid) firstInvalid = celular;
      }
    }
  }

  // Campos obrigatórios comuns
  visibleFields.forEach((field) => {
    if (!field.hasAttribute("required")) return;

    if (field.type === "radio" || field.type === "checkbox") return;

    const empty = !String(field.value || "").trim();
    if (empty) {
      valid = false;
      field.classList.add("invalid");
      const container = field.closest(".field") || field.parentElement;
      appendFieldError(container, "Campo obrigatório.");
      if (!firstInvalid) firstInvalid = field;
    }
  });

  // Validações específicas por tipo/campo
  visibleFields.forEach((field) => {
    const id = field.id || "";
    const value = String(field.value || "").trim();

    if (!value) return;

    if (
      [
        "beneficiario_cpf_cnpj",
        "representante_cpf_cnpj",
        "cb_cpf_cnpj",
        "cr_cpf_cnpj"
      ].includes(id)
    ) {
      if (!isValidCpfCnpjLength(value)) {
        valid = false;
        field.classList.add("invalid");
        const container = field.closest(".field") || field.parentElement;
        appendFieldError(container, "Informe 11 dígitos para CPF ou 14 dígitos para CNPJ.");
        if (!firstInvalid) firstInvalid = field;
      }
    }

    if (id === "prefixo_outra_uf") {
      const len = digitsOnly(value).length;
      if (len < 1 || len > 4) {
        valid = false;
        field.classList.add("invalid");
        const container = field.closest(".field") || field.parentElement;
        appendFieldError(container, "Informe de 1 a 4 dígitos.");
        if (!firstInvalid) firstInvalid = field;
      }
    }
  });

  // Grupos de radio obrigatórios
  const radioGroups = new Set(
    visibleFields
      .filter((field) => field.type === "radio" && field.hasAttribute("required"))
      .map((field) => field.name)
  );

  radioGroups.forEach((name) => {
    const radios = Array.from(step.querySelectorAll(`input[name="${name}"]`)).filter(
      (radio) => radio.offsetParent !== null
    );
    const checked = radios.find((radio) => radio.checked);

    if (!checked) {
      valid = false;
      radios.forEach((radio) => radio.classList.add("invalid"));
      const container =
        radios[0]?.closest(".choice-list") ||
        radios[0]?.closest(".mini-choice-list") ||
        radios[0]?.closest(".field") ||
        radios[0]?.parentElement;
      appendFieldError(container, "Selecione uma opção.");
      if (!firstInvalid) firstInvalid = radios[0];
    }
  });

  // Checkboxes obrigatórios
  const checkboxes = visibleFields.filter(
    (field) => field.type === "checkbox" && field.hasAttribute("required")
  );

  checkboxes.forEach((checkbox) => {
    if (!checkbox.checked) {
      valid = false;
      checkbox.classList.add("invalid");
      const container = checkbox.closest(".declaration-box") || checkbox.parentElement;
      appendFieldError(container, "Este campo precisa ser marcado.");
      if (!firstInvalid) firstInvalid = checkbox;
    }
  });

  if (!valid) {
    const errorBox = document.createElement("div");
    errorBox.className = "step-error-box";
    errorBox.textContent = "Revise os campos obrigatórios destacados antes de continuar.";
    step.prepend(errorBox);

    if (firstInvalid) {
      firstInvalid.scrollIntoView({ behavior: "smooth", block: "center" });
      firstInvalid.focus?.();
    }
  }

  return valid;
}
function showStep(stepNumber) {
  currentStep = stepNumber;

  steps.forEach((step) => {
    const isCurrent = Number(step.dataset.step) === stepNumber;
    step.classList.toggle("active", showAll || isCurrent);
  });

  if (progressFill) {
    progressFill.style.width = `${(stepNumber / steps.length) * 100}%`;
  }

  if (currentStepLabel) currentStepLabel.textContent = stepNumber;
  if (currentStepName) currentStepName.textContent = stepNames[stepNumber] || "";

  prevBtn.classList.toggle("hidden", stepNumber === 1 || showAll);
  nextBtn.classList.toggle("hidden", stepNumber === steps.length || showAll);
  submitBtn.classList.toggle("hidden", stepNumber !== steps.length && !showAll);

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function importPersonData(source, target) {
  const sourceMap = {
    beneficiario: {
      nome: document.getElementById("beneficiario_nome")?.value || "",
      cpf: document.getElementById("beneficiario_cpf_cnpj")?.value || ""
    },
    representante: {
      nome: document.getElementById("representante_nome")?.value || "",
      cpf: document.getElementById("representante_cpf_cnpj")?.value || ""
    }
  };

  const targetMap = {
    cb: {
      nome: document.getElementById("cb_nome"),
      cpf: document.getElementById("cb_cpf_cnpj")
    },
    cr: {
      nome: document.getElementById("cr_nome"),
      cpf: document.getElementById("cr_cpf_cnpj")
    }
  };

  const origem = sourceMap[source];
  const destino = targetMap[target];

  if (!origem || !destino) return;

  if (destino.nome) destino.nome.value = origem.nome;
  if (destino.cpf) destino.cpf.value = origem.cpf;

  updateSummary();
  updateChecklist();
  updateDynamicSections();
}

function toggleAllSteps() {
  showAll = !showAll;

  if (showAll) {
    steps.forEach((step) => step.classList.add("active"));
    prevBtn.classList.add("hidden");
    nextBtn.classList.add("hidden");
    submitBtn.classList.remove("hidden");
    toggleAllBtn.textContent = "Voltar ao modo por etapas";
    if (progressFill) progressFill.style.width = "100%";
  } else {
    toggleAllBtn.textContent = "Ver formulário completo";
    showStep(currentStep);
  }
}

function formatPhone(value) {
  const digits = String(value || "").replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 2) {
    return digits;
  }

  if (digits.length <= 6) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  }

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function applyPhoneMask(input) {
  if (!input) return;

  input.addEventListener("input", () => {
    input.value = formatPhone(input.value);
  });
}

function isValidPhone(value) {
  const digits = String(value || "").replace(/\D/g, "");
  return digits.length === 10 || digits.length === 11;
}

function abrirSobre() {
  document.getElementById("overlaySobre").classList.add("show");
}

function fecharSobre() {
  document.getElementById("overlaySobre").classList.remove("show");
}

function updateDynamicSections() {
  updateContaJudicial();
  updateFormaRecebimento();
  updateTipoConta("cb");
  updateTipoConta("cr");
  updateTipoValor("cb");
  updateTipoValor("cr");
  updateDivisaoCreditoAlert();
  updateIR();
  updateAnalfabeto();
  updateRepresentacao();

  fillBankCode("cb_banco_select", "cb_numero", "cb_outro_banco_wrap", "cb_outro_banco_nome", "cb_outro_banco_numero");
  fillBankCode("cr_banco_select", "cr_numero", "cr_outro_banco_wrap", "cr_outro_banco_nome", "cr_outro_banco_numero");

  updateChecklist();
  updateSummary();
}

prevBtn?.addEventListener("click", () => {
  if (currentStep > 1) {
    showStep(currentStep - 1);
  }
});

nextBtn?.addEventListener("click", () => {
  updateDynamicSections();
  const ok = validateStep(currentStep);
  if (!ok) return;

  if (currentStep < steps.length) {
    showStep(currentStep + 1);
  }
});

toggleAllBtn?.addEventListener("click", () => {
  toggleAllSteps();
});

form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  updateDynamicSections();

  let allValid = true;

  for (let i = 1; i <= steps.length; i += 1) {
    if (!validateStep(i)) {
      allValid = false;
    }
  }

  if (!allValid) return;

  const formData = new FormData(form);
  const data = {};

  for (const [key, value] of formData.entries()) {
    data[key] = value;
  }

  const cbBancoSelect = document.getElementById("cb_banco_select");
  if (cbBancoSelect && cbBancoSelect.selectedIndex >= 0) {
    data.cb_banco = cbBancoSelect.options[cbBancoSelect.selectedIndex].text || "";
    data.cb_banco_codigo = cbBancoSelect.value || "";
  }

  const crBancoSelect = document.getElementById("cr_banco_select");
  if (crBancoSelect && crBancoSelect.selectedIndex >= 0) {
    data.cr_banco = crBancoSelect.options[crBancoSelect.selectedIndex].text || "";
    data.cr_banco_codigo = crBancoSelect.value || "";
  }

  try {
    const response = await fetch("/gerar-pdf", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const erro = await response.text();
      alert("Erro ao gerar PDF: " + erro);
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    window.open(url, "_blank");
  } catch (err) {
    alert("Falha ao enviar dados para geração do PDF.");
    console.error(err);
  }
});

document.querySelectorAll("input, select, textarea").forEach((el) => {
  const eventName =
    el.type === "radio" || el.type === "checkbox" || el.tagName === "SELECT"
      ? "change"
      : "input";

  el.addEventListener(eventName, () => {
    if (el.classList.contains("invalid")) {
      el.classList.remove("invalid");
      const container = el.closest(".field") || el.parentElement;
      const err = container?.querySelector(".field-error");
      if (err) err.remove();
    }
    updateDynamicSections();
  });
});

document.addEventListener("DOMContentLoaded", () => {

  applyPhoneMask(document.getElementById("telefone"));
  applyPhoneMask(document.getElementById("celular"));
  applyCurrencyMask(document.getElementById("cb_valor_fixo"));
  applyCurrencyMask(document.getElementById("cb_valor_parcial"));
  applyCurrencyMask(document.getElementById("cr_valor_fixo"));
  applyCurrencyMask(document.getElementById("cr_valor_parcial"));

    function formatarTituloSimples(texto) {
        return texto
            .toLowerCase()
            .split(" ")
            .filter(parte => parte.trim() !== "")
            .map(parte => parte.charAt(0).toUpperCase() + parte.slice(1))
            .join(" ");
    }

    function formatarContaComDigito(valor) {
      const numeros = valor.replace(/\D/g, "");

      if (!numeros) return "";

      if (numeros.length === 1) {
        return `-${numeros}`;
      }

      const corpo = numeros.slice(0, -1);
      const digito = numeros.slice(-1);

      return `${corpo}-${digito}`;
    }

    const camposConta = [
      document.getElementById("cb_conta"),
      document.getElementById("cr_conta")
    ];

    camposConta.forEach(campo => {
      if (campo) {
        campo.addEventListener("input", function () {
          this.value = formatarContaComDigito(this.value);
        });
      }
    });

    function formatarNomePessoa(texto) {
        const excecoes = ["da", "de", "do", "das", "dos", "e"];

        return texto
            .toLowerCase()
            .split(" ")
            .filter(parte => parte.trim() !== "")
            .map((parte, index) => {
                if (index > 0 && excecoes.includes(parte)) {
                    return parte;
                }
                return parte.charAt(0).toUpperCase() + parte.slice(1);
            })
            .join(" ");
    }

      const campoData = document.getElementById("data");
      if (campoData) {
        const hoje = new Date();
        const ano = hoje.getFullYear();
        const mes = String(hoje.getMonth() + 1).padStart(2, "0");
        const dia = String(hoje.getDate()).padStart(2, "0");
        campoData.value = `${ano}-${mes}-${dia}`;
      }

    const campoLocal = document.getElementById("local");
    if (campoLocal) {
        campoLocal.addEventListener("input", function () {
            this.value = this.value.slice(0, 20);
        });

        campoLocal.addEventListener("blur", function () {
            this.value = formatarTituloSimples(this.value);
        });
    }

    const camposNome = [
        document.getElementById("beneficiario_nome"),
        document.getElementById("representante_nome"),
        document.getElementById("cb_nome"),
        document.getElementById("cr_nome")
    ];

    camposNome.forEach(campo => {
        if (campo) {
            campo.addEventListener("blur", function () {
                this.value = formatarNomePessoa(this.value);
            });
        }
    });


  Object.entries(bankList).forEach(([code, name]) => {
    ["cb_banco_select", "cr_banco_select"].forEach((selectId) => {
      const select = document.getElementById(selectId);
      if (!select) return;

      const exists = Array.from(select.options).some((opt) => opt.value === code);
      if (!exists) {
        const option = document.createElement("option");
        option.value = code;
        option.textContent = name;
        select.appendChild(option);
      }
    });
  });

  ["cb_banco_select", "cr_banco_select"].forEach((selectId) => {
    const select = document.getElementById(selectId);
    if (select) {
      const existsOutro = Array.from(select.options).some((opt) => opt.value === "outro");
      if (!existsOutro) {
        const option = document.createElement("option");
        option.value = "outro";
        option.textContent = "Outro";
        select.appendChild(option);
      }
    }
  });

  [
    "beneficiario_cpf_cnpj",
    "representante_cpf_cnpj",
    "cb_cpf_cnpj",
    "cr_cpf_cnpj"
  ].forEach((id) => {
    const input = document.getElementById(id);
    applyCpfCnpjMask(input);
  });

  [
    "conta_judicial_1",
    "conta_judicial_2",
    "conta_judicial_3",
    "cb_numero",
    "cb_outro_banco_numero",
    "cb_agencia",
    "cr_numero",
    "cr_outro_banco_numero",
    "cr_agencia",
    "prefixo_outra_uf"
  ].forEach((id) => {
    const input = document.getElementById(id);
    const maxMap = {
      prefixo_outra_uf: 4
    };
    applyNumericOnly(input, maxMap[id] || null);
  });

document.querySelectorAll(".link-action").forEach((link) => {
  link.addEventListener("click", (e) => {
    e.preventDefault();
    const source = link.dataset.import;
    const target = link.dataset.target;
    importPersonData(source, target);
  });
});

document.getElementById("cb_banco_select")?.addEventListener("change", () => {
  updateTipoConta("cb");
});

document.getElementById("cr_banco_select")?.addEventListener("change", () => {
  updateTipoConta("cr");
});

  showStep(1);
  updateDynamicSections();
});