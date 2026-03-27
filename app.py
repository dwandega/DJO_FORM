from flask import Flask, render_template, request, send_file, jsonify
from datetime import datetime
import fitz  # PyMuPDF
import tempfile
import os
import io


app = Flask(__name__)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_BASE = os.path.join(BASE_DIR, "pdf", "Formulário Resgate 2.pdf")
PDF_ISENCAO = os.path.join(BASE_DIR, "pdf", "Declaração Isenção IR 2.pdf")


def write_text(page, x, y, text, size=10):
    if text is None:
        return

    text = str(text).strip()
    if not text:
        return

    page.insert_text(
        (x, y),
        text,
        fontsize=size,
        fontname="helv",
        color=(0, 0, 0.3)
    )


def mark_x(page, x, y, size=11):
    page.insert_text(
        (x, y),
        "X",
        fontsize=size,
        fontname="helv",
        color=(0, 0, 0)
    )


def formatar_data_pdf(data_str):
    if not data_str:
        return "", "", ""

    try:
        partes = data_str.split("-")
        if len(partes) == 3:
            ano, mes, dia = partes
        else:
            partes = data_str.split("/")
            if len(partes) == 3:
                dia, mes, ano = partes
            else:
                return "", "", ""

        meses = {
            "01": "janeiro",
            "02": "fevereiro",
            "03": "março",
            "04": "abril",
            "05": "maio",
            "06": "junho",
            "07": "julho",
            "08": "agosto",
            "09": "setembro",
            "10": "outubro",
            "11": "novembro",
            "12": "dezembro",
        }

        dia = str(int(dia))
        mes_extenso = meses.get(mes.zfill(2), "")
        ano_curto = str(ano)[-2:]

        return dia, mes_extenso, ano_curto
    except Exception:
        return "", "", ""


def formatar_titulo_simples(texto):
    if not texto:
        return ""

    palavras = str(texto).strip().lower().split()
    return " ".join(p.capitalize() for p in palavras)


def formatar_nome_pessoa(texto):
    if not texto:
        return ""

    excecoes = {"da", "de", "do", "das", "dos", "e"}
    palavras = str(texto).strip().lower().split()

    resultado = []
    for i, palavra in enumerate(palavras):
        if i > 0 and palavra in excecoes:
            resultado.append(palavra)
        else:
            resultado.append(palavra.capitalize())

    return " ".join(resultado)

@app.route("/")
def index():
    return render_template("formulario.html")


@app.route("/gerar-pdf", methods=["POST"])
def gerar_pdf():
    try:
        data = request.get_json(force=True)

        if data.get("local"):
            data["local"] = formatar_titulo_simples(data["local"])[:20]

        for campo_nome in [
            "beneficiario_nome",
            "representante_nome",
            "cb_nome",
            "cr_nome"
        ]:
            if data.get(campo_nome):
                data[campo_nome] = formatar_nome_pessoa(data[campo_nome])


        FIELD_MAP = {
            "beneficiario_nome": {"page": 0, "x": 57, "y": 113, "size": 11},
            "beneficiario_cpf_cnpj": {"page": 0, "x": 395, "y": 113, "size": 11},
            "representante_nome": {"page": 0, "x": 57, "y": 155, "size": 11},
            "representante_cpf_cnpj": {"page": 0, "x": 395, "y": 155, "size": 11},
        }

        TIPO_RESGATE_MAP = {
            "estadual": {"page": 0, "x": 24.5, "y": 183.5, "size": 11},
            "trabalhista": {"page": 0, "x": 172.5, "y": 183.5, "size": 11},
            "precatorio_federal": {"page": 0, "x": 329, "y": 183.5, "size": 11},
        }

        CONTA_JUDICIAL_MAP = {
            "conta_judicial_1": {"page": 0, "x": 133, "y": 208, "size": 11},
            "conta_judicial_2": {"page": 0, "x": 287, "y": 208, "size": 11},
            "conta_judicial_3": {"page": 0, "x": 432, "y": 208, "size": 11},
        }

        FORMA_RECEBIMENTO_MAP = {
            "autorizacao_permanente": {"page": 0, "x": 24.5, "y": 245.3, "size": 11},
            "convenio_djc": {"page": 0, "x": 24.5, "y": 272.5, "size": 11},
            "credito_beneficiario": {"page": 0, "x": 24.5, "y": 300, "size": 11},
            "credito_representante": {"page": 0, "x": 24.5, "y": 445, "size": 11},
            "especie": {"page": 0, "x": 24.5, "y": 589.5, "size": 11},
        }

        CB_TIPO_CONTA_MAP = {
            "corrente": {"page": 0, "x": 53, "y": 369.5, "size": 11},
            "poupanca": {"page": 0, "x": 151, "y": 369.5, "size": 11},
        }

        CB_VALOR_TIPO_MAP = {
            "total": {"page": 0, "x": 57.3, "y": 390, "size": 11},
            "fixo": {"page": 0, "x": 57.3, "y": 410.5, "size": 11},
            "parcial": {"page": 0, "x": 241.5, "y": 410.5, "size": 11},
        }

        CR_TIPO_CONTA_MAP = {
            "corrente": {"page": 0, "x": 53, "y": 514, "size": 11},
            "poupanca": {"page": 0, "x": 151, "y": 514, "size": 11},
        }

        CR_VALOR_TIPO_MAP = {
            "total": {"page": 0, "x": 57.3, "y": 534.5, "size": 11},
            "fixo": {"page": 0, "x": 57.3, "y": 555, "size": 11},
            "parcial": {"page": 0, "x": 241.5, "y": 555, "size": 11},
        }

        ANALFABETO_MAP = {
            "sim": {"page": 0, "x": 195.5, "y": 720, "size": 11},
            "nao": {"page": 0, "x": 256, "y": 720, "size": 11},
        }

        CB_FIELD_MAP = {
            "cb_banco": {"page": 0, "x": 57, "y": 326, "size": 11},
            "cb_banco_codigo": {"page": 0, "x": 203, "y": 326, "size": 11},
            "cb_agencia": {"page": 0, "x": 285, "y": 326, "size": 11},
            "cb_conta": {"page": 0, "x": 395, "y": 326, "size": 11},
            "cb_nome": {"page": 0, "x": 57, "y": 346, "size": 11},
            "cb_cpf_cnpj": {"page": 0, "x": 395, "y": 346, "size": 11},
            "cb_variacao": {"page": 0, "x": 278, "y": 367, "size": 11},
            "cb_valor_fixo": {"page": 0, "x": 116, "y": 408, "size": 11},
            "cb_valor_parcial": {"page": 0, "x": 312, "y": 408, "size": 11},
            "cb_percentual": {"page": 0, "x": 500, "y": 408, "size": 11},
        }

        CR_FIELD_MAP = {
            "cr_banco": {"page": 0, "x": 57, "y": 470, "size": 11},
            "cr_banco_codigo": {"page": 0, "x": 203, "y": 470, "size": 11},
            "cr_agencia": {"page": 0, "x": 285, "y": 470, "size": 11},
            "cr_conta": {"page": 0, "x": 395, "y": 470, "size": 11},
            "cr_nome": {"page": 0, "x": 57, "y": 491, "size": 11},
            "cr_cpf_cnpj": {"page": 0, "x": 395, "y": 491, "size": 11},
            "cr_variacao": {"page": 0, "x": 278, "y": 511.5, "size": 11},
            "cr_valor_fixo": {"page": 0, "x": 116, "y": 552.5, "size": 11},
            "cr_valor_parcial": {"page": 0, "x": 312, "y": 552.5, "size": 11},
            "cr_percentual": {"page": 0, "x": 500, "y": 552.5, "size": 11},
        }

        ESPECIE_FIELD_MAP = {
            "prefixo_outra_uf": {"page": 0, "x": 220, "y": 608, "size": 11},
        }

        IR_ISENCAO_MAP = {
            "sim": {"page": 0, "x": 484, "y": 651, "size": 11},
            "nao": {"page": 0, "x": 527, "y": 651, "size": 11},
        }

        CONTATO_FIELD_MAP = {
            "telefone": {"page": 0, "x": 77, "y": 745, "size": 10},
            "celular": {"page": 0, "x": 244, "y": 745, "size": 10},
            "email": {"page": 0, "x": 405, "y": 745, "size": 10},
            "local": {"page": 0, "x": 90, "y": 767, "size": 10},
            "dia_data": {"page": 0, "x": 200, "y": 767, "size": 11},
            "mes_data": {"page": 0, "x": 235, "y": 767, "size": 11},
            "ano_data": {"page": 0, "x": 365, "y": 767, "size": 11},
        }

        doc = fitz.open(PDF_BASE)
        beneficiario_analfabeto = data.get("beneficiario_analfabeto")

        for field_name, cfg in FIELD_MAP.items():
            value = data.get(field_name)
            page = doc[cfg["page"]]
            write_text(page, cfg["x"], cfg["y"], value, cfg["size"])

        tipo_resgate = data.get("tipo_resgate")
        cfg = TIPO_RESGATE_MAP.get(tipo_resgate)
        if cfg:
            page = doc[cfg["page"]]
            mark_x(page, cfg["x"], cfg["y"], cfg["size"])

        for field_name, cfg in CONTA_JUDICIAL_MAP.items():
            value = data.get(field_name)
            page = doc[cfg["page"]]
            write_text(page, cfg["x"], cfg["y"], value, cfg["size"])

        forma_recebimento = data.get("forma_recebimento")
        credito_destino = data.get("credito_destino")

        if forma_recebimento == "autorizacao_permanente":
            cfg = FORMA_RECEBIMENTO_MAP["autorizacao_permanente"]
            page = doc[cfg["page"]]
            mark_x(page, cfg["x"], cfg["y"], cfg["size"])

        elif forma_recebimento == "convenio_djc":
            cfg = FORMA_RECEBIMENTO_MAP["convenio_djc"]
            page = doc[cfg["page"]]
            mark_x(page, cfg["x"], cfg["y"], cfg["size"])

        elif forma_recebimento == "especie":
            cfg = FORMA_RECEBIMENTO_MAP["especie"]
            page = doc[cfg["page"]]
            mark_x(page, cfg["x"], cfg["y"], cfg["size"])

            for field_name, cfg in ESPECIE_FIELD_MAP.items():
                value = data.get(field_name)
                page = doc[cfg["page"]]
                write_text(page, cfg["x"], cfg["y"], value, cfg["size"])

        elif forma_recebimento == "credito":
            if credito_destino in ("beneficiario", "ambos"):
                cfg = FORMA_RECEBIMENTO_MAP["credito_beneficiario"]
                page = doc[cfg["page"]]
                mark_x(page, cfg["x"], cfg["y"], cfg["size"])

                cb_tipo_conta = data.get("cb_tipo_conta")
                cfg = CB_TIPO_CONTA_MAP.get(cb_tipo_conta)
                if cfg:
                    page = doc[cfg["page"]]
                    mark_x(page, cfg["x"], cfg["y"], cfg["size"])

                cb_valor_tipo = data.get("cb_valor_tipo")

                # ajuste: percentual usa mesma posição de parcial
                if cb_valor_tipo == "percentual":
                    cb_valor_tipo = "parcial"

                cfg = CB_VALOR_TIPO_MAP.get(cb_valor_tipo)
                if cfg:
                    page = doc[cfg["page"]]
                    mark_x(page, cfg["x"], cfg["y"], cfg["size"])

                for field_name, cfg in CB_FIELD_MAP.items():
                    value = data.get(field_name)
                    page = doc[cfg["page"]]
                    write_text(page, cfg["x"], cfg["y"], value, cfg["size"])

            if credito_destino in ("representante", "ambos"):
                cfg = FORMA_RECEBIMENTO_MAP["credito_representante"]
                page = doc[cfg["page"]]
                mark_x(page, cfg["x"], cfg["y"], cfg["size"])

                cr_tipo_conta = data.get("cr_tipo_conta")
                cfg = CR_TIPO_CONTA_MAP.get(cr_tipo_conta)
                if cfg:
                    page = doc[cfg["page"]]
                    mark_x(page, cfg["x"], cfg["y"], cfg["size"])

                cr_valor_tipo = data.get("cr_valor_tipo")

                # ajuste: percentual usa mesma posição de parcial
                if cr_valor_tipo == "percentual":
                    cr_valor_tipo = "parcial"

                cfg = CR_VALOR_TIPO_MAP.get(cr_valor_tipo)
                if cfg:
                    page = doc[cfg["page"]]
                    mark_x(page, cfg["x"], cfg["y"], cfg["size"])

                for field_name, cfg in CR_FIELD_MAP.items():
                    value = data.get(field_name)
                    page = doc[cfg["page"]]
                    write_text(page, cfg["x"], cfg["y"], value, cfg["size"])

        isento_ir = data.get("isento_ir")
        cfg = IR_ISENCAO_MAP.get(isento_ir)
        if cfg:
            page = doc[cfg["page"]]
            mark_x(page, cfg["x"], cfg["y"], cfg["size"])

        beneficiario_analfabeto = data.get("beneficiario_analfabeto")
        cfg = ANALFABETO_MAP.get(beneficiario_analfabeto)
        if cfg:
            page = doc[cfg["page"]]
            mark_x(page, cfg["x"], cfg["y"], cfg["size"])

        for field_name, cfg in CONTATO_FIELD_MAP.items():
            if field_name in ("dia_data", "mes_data", "ano_data"):
                continue
            value = data.get(field_name)
            page = doc[cfg["page"]]
            write_text(page, cfg["x"], cfg["y"], value, cfg["size"])

        hoje = datetime.now().strftime("%Y-%m-%d")
        dia_data, mes_data, ano_data = formatar_data_pdf(hoje)

        cfg = CONTATO_FIELD_MAP["dia_data"]
        write_text(doc[cfg["page"]], cfg["x"], cfg["y"], dia_data, cfg["size"])

        cfg = CONTATO_FIELD_MAP["mes_data"]
        write_text(doc[cfg["page"]], cfg["x"], cfg["y"], mes_data, cfg["size"])

        cfg = CONTATO_FIELD_MAP["ano_data"]
        write_text(doc[cfg["page"]], cfg["x"], cfg["y"], ano_data, cfg["size"])

        #if beneficiario_analfabeto != "sim" and len(doc) > 1:
            #doc.delete_page(1)

        if data.get("isento_ir") == "sim":
            pdf_isencao_bytes = gerar_pdf_isencao(data)
            pdf_isencao_bytes.seek(0)
            doc_isencao = fitz.open(stream=pdf_isencao_bytes.read(), filetype="pdf")
            doc.insert_pdf(doc_isencao) 
            doc_isencao.close()

        pdf_bytes = io.BytesIO()
        doc.save(pdf_bytes)
        doc.close()

        pdf_bytes.seek(0)

        return send_file(
            pdf_bytes,
            as_attachment=True,
            download_name="formulario_resgate_preenchido.pdf",
            mimetype="application/pdf"
        )

    except Exception as e:
        return jsonify({"erro": str(e)}), 500



def gerar_pdf_isencao(data):  

    for k, v in data.items():
        print(k, "=>", v)

    ISENCAO_FIELD_MAP = {
        "beneficiario_nome": {"x": 120, "y": 115, "size": 11},
        "ir_endereco": {"x": 120, "y": 140, "size": 11},
        "beneficiario_cpf_cnpj": {"x": 320, "y": 165, "size": 11},
    }

    ISENCAO_PROCESSO_MAP = {
        "ir_processo": {"x": 240, "y": 190, "size": 11},
        "ir_numero_vara": {"x": 100, "y": 210, "size": 11},
        "ir_especificacao_vara": {"x": 150, "y": 210, "size": 11},
    }

    ISENCAO_PROCESSO_MAP = {
        "ir_processo": {"x": 240, "y": 190, "size": 11},
        "ir_numero_vara": {"x": 100, "y": 210, "size": 11},
        "ir_especificacao_vara": {"x": 150, "y": 210, "size": 11},
    }

    ISENCAO_CHECK_MAP = {
        "montante": {"x": 60, "y": 240, "size": 11},
        "simples": {"x": 60, "y": 270, "size": 11},
    }

    ISENCAO_VALOR_MAP = {
        "ir_valor": {"x": 200, "y": 240, "size": 11},
    }

    ISENCAO_DATA_MAP = {
        "local": {"x": 100, "y": 320, "size": 11},
        "uf": {"x": 260, "y": 320, "size": 11},
        "dia": {"x": 320, "y": 320, "size": 11},
        "mes": {"x": 350, "y": 320, "size": 11},
        "ano": {"x": 430, "y": 320, "size": 11},
    }

    doc = fitz.open(PDF_ISENCAO)
    page = doc[0]

    write_text(page, 65, 230, data.get("beneficiario_nome"), size=11)
    write_text(page, 65, 250, data.get("ir_endereco"), size=11)
    write_text(page, 77, 272, data.get("beneficiario_cpf_cnpj"), size=11)

    write_text(page, 320, 312, data.get("ir_processo"), size=11)
    write_text(page, 70, 334, data.get("ir_numero_vara"), size=11)
    write_text(page, 275, 334, data.get("ir_comarca"), size=11)

    tipo = data.get("ir_tipo")

    if tipo == "montante":
        mark_x(page, 76.1, 380.1)
        write_text(page, 185, 380, data.get("ir_valor"), size=11)

    elif tipo == "simples":
        mark_x(page, 76.5, 426)

    # data automática
    hoje = datetime.now()

    hoje_str = hoje.strftime("%Y-%m-%d")
    dia, mes, ano = formatar_data_pdf(hoje_str)


    write_text(page, 221, 621, ".", size=11)
    write_text(page, 224, 621, ".", size=11)
    write_text(page, 227, 621, ".", size=11)
    write_text(page, 230, 621, ".", size=11)
    write_text(page, 233, 621, ".", size=11)
    write_text(page, 236, 621, ".", size=11)
    write_text(page, 239, 621, ".", size=11)
    write_text(page, 242, 621, ".", size=11)
    write_text(page, 245, 621, ".", size=11)
    write_text(page, 248, 621, ".", size=11)
    write_text(page, 251, 621, ".", size=11)


    write_text(page, 221, 617, data.get("local"), size=10)
    write_text(page, 330, 617, data.get("ir_uf"), size=11)
    write_text(page, 352, 617, dia, size=11)
    write_text(page, 390, 617, mes, size=11)
    write_text(page, 480, 617, ano, size=11)

    pdf_bytes = io.BytesIO()
    doc.save(pdf_bytes)
    doc.close()

    pdf_bytes.seek(0)

    return pdf_bytes





if __name__ == "__main__":
    app.run(debug=True)