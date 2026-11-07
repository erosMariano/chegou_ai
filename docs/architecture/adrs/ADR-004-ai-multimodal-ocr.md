# ADR-004: Extração de Etiquetas via LLM Multimodal com Structured Outputs

* **Status:** Aceito
* **Data:** Novembro/2026

## Contexto
Etiquetas de transportadoras (Mercado Livre, Amazon, Shopee, Correios) possuem layouts heterogêneos, fontes variadas, danos físicos e informações misturadas entre remetente e destinatário.

## Opções Consideradas
1. **OCR Tradicional (Tesseract) + Expressões Regulares (Regex):** Custo zero de API, porém altíssima fragilidade — qualquer mudança no layout da etiqueta quebra a extração e exige manutenção constante de regras.
2. **LLM Multimodal rápido (ex.: Gemini 2.5 Flash) com JSON Schema estrito (Structured Outputs):** Compreensão semântica e espacial da imagem em *zero-shot*.

## Decisão
Adotar **LLM Multimodal com Structured Outputs** como motor primário de leitura, exigindo retorno tipado com campo `confidence_score` (0.0 a 1.0) e fallback automático para preenchimento manual caso o score seja inferior a `0.80` ou o tempo de resposta ultrapasse `4 segundos`.

## Consequências
* **Positivas:** Alta precisão desde o primeiro dia sem treinamento customizado; distinção inteligente entre endereço do condomínio e nome/unidade do morador.
* **Negativas:** Custo variável por requisição e dependência de rede externa (mitigados por compressão de imagem no cliente antes do upload e timeout rígido com fallback).