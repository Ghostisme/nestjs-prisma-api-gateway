/**
 * Apifox OpenAPI 同步脚本
 * 用法: npx ts-node scripts/apifox-sync.ts
 * 依赖环境变量: APIFOX_PROJECT_ID, APIFOX_API_KEY
 */

async function main() {
  const projectId = process.env.APIFOX_PROJECT_ID;
  const apiKey = process.env.APIFOX_API_KEY;

  if (!projectId || !apiKey) {
    console.error('请设置环境变量 APIFOX_PROJECT_ID 和 APIFOX_API_KEY');
    process.exit(1);
  }

  const port = process.env.PORT ?? 9008;
  const swaggerUrl = `http://localhost:${port}/api-docs-json`;

  console.log(`正在从 ${swaggerUrl} 获取 OpenAPI 文档...`);

  const resp = await fetch(swaggerUrl);
  if (!resp.ok) {
    console.error(`获取 Swagger JSON 失败: ${resp.status} ${resp.statusText}`);
    console.error('请确保 lumax-service 正在运行且 SWAGGER_ENABLED=true');
    process.exit(1);
  }

  const openApiSpec = await resp.text();
  console.log(`获取成功，文档大小: ${openApiSpec.length} 字节`);

  console.log('正在同步到 Apifox...');
  const apifoxResp = await fetch(
    `https://api.apifox.com/v1/projects/${projectId}/import-openapi`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Apifox-Api-Version': '2024-03-28',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: {
          data: openApiSpec,
        },
        options: {
          targetEndpointFolderId: 0,
          endpointOverwriteMode: 'methodAndPath',
          schemaOverwriteMode: 'name',
          updateFolderOfChangedEndpoint: true,
        },
      }),
    },
  );

  if (!apifoxResp.ok) {
    const errText = await apifoxResp.text();
    console.error(`Apifox 同步失败: ${apifoxResp.status}`, errText);
    process.exit(1);
  }

  const result = await apifoxResp.json();
  console.log('Apifox 同步成功:', JSON.stringify(result, null, 2));
}

main().catch(console.error);
