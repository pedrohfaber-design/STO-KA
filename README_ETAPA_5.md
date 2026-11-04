# STO KA — Etapa 5 | Importação Excel

1. Execute `database/etapa_5_1_importacao.sql` no SQL Editor do Supabase.
2. Configure **localmente** `js/config.js` com URL e chave pública do Supabase (não envie chaves secretas).
3. Abra `importacao.html` no Live Server após login e vínculo com empresa.
4. Baixe um dos dois modelos na própria página, preencha sem modificar o cabeçalho e selecione o tipo correspondente.
5. Valide, revise a prévia e confirme.

**Regras:** limite de 1000 linhas e 5 MB por arquivo; códigos únicos por empresa; produtos desativados bloqueados; atualização substitui somente a quantidade; novos produtos precisam de nome, estoque mínimo e categoria previamente cadastrada (ou campo vazio). Importação atômica, com registro em `importacoes` e `movimentacoes`.

**Importante:** planilhas são lidas no navegador via SheetJS (CDN); a autorização e a validação são repetidas no PostgreSQL. O SQL precisa ser executado antes do primeiro teste. Para importações maiores, dividir em lotes. Não utilize planilhas com dados confidenciais em ambientes sem política de segurança definida.
