-- =====================================================
-- SCRIPT DE DADOS DE TESTE - PERFORM
-- Conta: banca@senac.com | Senha: Senac@2025
-- =====================================================

-- Limpar dados existentes (opcional - descomente se quiser resetar)
-- DELETE FROM github_pr_reviews;
-- DELETE FROM github_commits;
-- DELETE FROM github_pull_requests;
-- DELETE FROM monitored_repositories;
-- DELETE FROM github_configurations;
-- DELETE FROM metrics;
-- DELETE FROM code_reviews;
-- DELETE FROM commits;
-- DELETE FROM pull_requests;
-- DELETE FROM developers;
-- DELETE FROM squads;
-- DELETE FROM users WHERE email = 'banca@senac.com';

-- =====================================================
-- 1. CRIAR USUÁRIO PRINCIPAL
-- =====================================================
INSERT INTO users (id, email, name, password, role, github_username, avatar_url, active, created_at, updated_at)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'banca@senac.com',
  'Banca SENAC',
  '$2b$10$OBMb057KMXio/lsIIvbomu4XI2MLUcqDYMgH1mdsbMGH2W3SqRa7S',
  'admin',
  'banca-senac',
  'https://avatars.githubusercontent.com/u/1234567',
  true,
  NOW(),
  NOW()
) ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password = EXCLUDED.password,
  role = EXCLUDED.role,
  updated_at = NOW();

-- =====================================================
-- 2. CRIAR SQUADS
-- =====================================================
INSERT INTO squads (id, name, description, github_team, active, created_at, updated_at)
VALUES 
  ('b1111111-1111-1111-1111-111111111111', 'Backend Team', 'Equipe responsável pelo desenvolvimento backend e APIs', 'backend-team', true, NOW(), NOW()),
  ('b2222222-2222-2222-2222-222222222222', 'Frontend Team', 'Equipe responsável pelo desenvolvimento frontend e UX', 'frontend-team', true, NOW(), NOW()),
  ('b3333333-3333-3333-3333-333333333333', 'DevOps Team', 'Equipe responsável por infraestrutura e CI/CD', 'devops-team', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. CRIAR DEVELOPERS
-- =====================================================
INSERT INTO developers (id, github_id, name, email, github_username, avatar_url, profile_url, active, squad_id, created_at, updated_at)
VALUES 
  -- Backend Team
  ('d1111111-1111-1111-1111-111111111111', '10001', 'Carlos Silva', 'carlos.silva@empresa.com', 'carlos-silva', 'https://avatars.githubusercontent.com/u/10001', 'https://github.com/carlos-silva', true, 'b1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('d2222222-2222-2222-2222-222222222222', '10002', 'Ana Santos', 'ana.santos@empresa.com', 'ana-santos', 'https://avatars.githubusercontent.com/u/10002', 'https://github.com/ana-santos', true, 'b1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('d3333333-3333-3333-3333-333333333333', '10003', 'Pedro Oliveira', 'pedro.oliveira@empresa.com', 'pedro-oliveira', 'https://avatars.githubusercontent.com/u/10003', 'https://github.com/pedro-oliveira', true, 'b1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  
  -- Frontend Team
  ('d4444444-4444-4444-4444-444444444444', '10004', 'Mariana Costa', 'mariana.costa@empresa.com', 'mariana-costa', 'https://avatars.githubusercontent.com/u/10004', 'https://github.com/mariana-costa', true, 'b2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('d5555555-5555-5555-5555-555555555555', '10005', 'Lucas Ferreira', 'lucas.ferreira@empresa.com', 'lucas-ferreira', 'https://avatars.githubusercontent.com/u/10005', 'https://github.com/lucas-ferreira', true, 'b2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('d6666666-6666-6666-6666-666666666666', '10006', 'Julia Almeida', 'julia.almeida@empresa.com', 'julia-almeida', 'https://avatars.githubusercontent.com/u/10006', 'https://github.com/julia-almeida', true, 'b2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  
  -- DevOps Team
  ('d7777777-7777-7777-7777-777777777777', '10007', 'Rafael Lima', 'rafael.lima@empresa.com', 'rafael-lima', 'https://avatars.githubusercontent.com/u/10007', 'https://github.com/rafael-lima', true, 'b3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  ('d8888888-8888-8888-8888-888888888888', '10008', 'Fernanda Rocha', 'fernanda.rocha@empresa.com', 'fernanda-rocha', 'https://avatars.githubusercontent.com/u/10008', 'https://github.com/fernanda-rocha', true, 'b3333333-3333-3333-3333-333333333333', NOW(), NOW())
ON CONFLICT (github_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  updated_at = NOW();

-- =====================================================
-- 4. CRIAR PULL REQUESTS
-- =====================================================
INSERT INTO pull_requests (id, github_id, pr_number, title, description, status, repository_name, base_branch, head_branch, lines_added, lines_deleted, files_changed, opened_at, closed_at, merged_at, url, "authorId", created_at, updated_at)
VALUES 
  -- PRs merged recentemente
  ('11111111-1111-1111-1111-111111111111', 'gh_pr_1001', 101, 'feat: Add user authentication', 'Implementação do sistema de autenticação com JWT', 'merged', 'perform-api', 'main', 'feature/auth', 450, 120, 15, NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 'https://github.com/org/perform-api/pull/101', 'd1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'gh_pr_1002', 102, 'fix: Resolve memory leak in cache service', 'Corrigido vazamento de memória no serviço de cache', 'merged', 'perform-api', 'main', 'fix/memory-leak', 85, 200, 8, NOW() - INTERVAL '6 days', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', 'https://github.com/org/perform-api/pull/102', 'd2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'gh_pr_1003', 103, 'feat: Implement dashboard metrics', 'Dashboard com métricas de performance da equipe', 'merged', 'perform-front', 'main', 'feature/dashboard', 890, 45, 22, NOW() - INTERVAL '5 days', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', 'https://github.com/org/perform-front/pull/103', 'd4444444-4444-4444-4444-444444444444', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'gh_pr_1004', 104, 'refactor: Optimize database queries', 'Otimização de queries N+1 no módulo de reports', 'merged', 'perform-api', 'main', 'refactor/queries', 320, 280, 12, NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', 'https://github.com/org/perform-api/pull/104', 'd3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  
  -- PRs abertos
  ('55555555-5555-5555-5555-555555555555', 'gh_pr_1005', 105, 'feat: Add CI/CD pipeline', 'Configuração do pipeline de CI/CD com GitHub Actions', 'open', 'perform-api', 'main', 'feature/cicd', 250, 0, 8, NOW() - INTERVAL '2 days', NULL, NULL, 'https://github.com/org/perform-api/pull/105', 'd7777777-7777-7777-7777-777777777777', NOW(), NOW()),
  ('66666666-6666-6666-6666-666666666666', 'gh_pr_1006', 106, 'feat: Responsive design improvements', 'Melhorias no design responsivo para mobile', 'open', 'perform-front', 'main', 'feature/responsive', 420, 180, 18, NOW() - INTERVAL '1 day', NULL, NULL, 'https://github.com/org/perform-front/pull/106', 'd5555555-5555-5555-5555-555555555555', NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', 'gh_pr_1007', 107, 'docs: Update API documentation', 'Atualização da documentação da API com Swagger', 'open', 'perform-api', 'main', 'docs/swagger', 180, 50, 6, NOW() - INTERVAL '12 hours', NULL, NULL, 'https://github.com/org/perform-api/pull/107', 'd2222222-2222-2222-2222-222222222222', NOW(), NOW())
ON CONFLICT (github_id) DO UPDATE SET
  title = EXCLUDED.title,
  status = EXCLUDED.status,
  updated_at = NOW();

-- =====================================================
-- 5. CRIAR COMMITS
-- =====================================================
INSERT INTO commits (id, github_id, sha, message, repository_name, branch_name, lines_added, lines_deleted, files_changed, committed_at, url, "authorId", created_at, updated_at)
VALUES 
  -- Commits de Carlos Silva
  ('c1111111-1111-1111-1111-111111111111', 'gh_c_1001', 'abc123def456789abc123def456789abc123def4', 'feat: Add JWT token generation', 'perform-api', 'feature/auth', 150, 20, 5, NOW() - INTERVAL '7 days', 'https://github.com/org/perform-api/commit/abc123', 'd1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('c1111111-1111-1111-1111-111111111112', 'gh_c_1002', 'bcd234def567890bcd234def567890bcd234def5', 'feat: Add authentication middleware', 'perform-api', 'feature/auth', 200, 50, 6, NOW() - INTERVAL '6 days', 'https://github.com/org/perform-api/commit/bcd234', 'd1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('c1111111-1111-1111-1111-111111111113', 'gh_c_1003', 'cde345def678901cde345def678901cde345def6', 'test: Add auth unit tests', 'perform-api', 'feature/auth', 100, 0, 4, NOW() - INTERVAL '5 days', 'https://github.com/org/perform-api/commit/cde345', 'd1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  
  -- Commits de Ana Santos
  ('c2222222-2222-2222-2222-222222222221', 'gh_c_2001', 'def456abc789012def456abc789012def456abc7', 'fix: Clear cache on memory threshold', 'perform-api', 'fix/memory-leak', 45, 120, 4, NOW() - INTERVAL '6 days', 'https://github.com/org/perform-api/commit/def456', 'd2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('c2222222-2222-2222-2222-222222222222', 'gh_c_2002', 'efg567abc890123efg567abc890123efg567abc8', 'fix: Add garbage collection trigger', 'perform-api', 'fix/memory-leak', 40, 80, 4, NOW() - INTERVAL '5 days', 'https://github.com/org/perform-api/commit/efg567', 'd2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  
  -- Commits de Mariana Costa
  ('c4444444-4444-4444-4444-444444444441', 'gh_c_4001', 'fgh678bcd901234fgh678bcd901234fgh678bcd9', 'feat: Create dashboard layout', 'perform-front', 'feature/dashboard', 350, 20, 8, NOW() - INTERVAL '5 days', 'https://github.com/org/perform-front/commit/fgh678', 'd4444444-4444-4444-4444-444444444444', NOW(), NOW()),
  ('c4444444-4444-4444-4444-444444444442', 'gh_c_4002', 'ghi789cde012345ghi789cde012345ghi789cde0', 'feat: Add metrics charts', 'perform-front', 'feature/dashboard', 400, 15, 10, NOW() - INTERVAL '4 days', 'https://github.com/org/perform-front/commit/ghi789', 'd4444444-4444-4444-4444-444444444444', NOW(), NOW()),
  ('c4444444-4444-4444-4444-444444444443', 'gh_c_4003', 'hij890def123456hij890def123456hij890def1', 'style: Polish dashboard UI', 'perform-front', 'feature/dashboard', 140, 10, 4, NOW() - INTERVAL '3 days', 'https://github.com/org/perform-front/commit/hij890', 'd4444444-4444-4444-4444-444444444444', NOW(), NOW()),
  
  -- Commits de Pedro Oliveira
  ('c3333333-3333-3333-3333-333333333331', 'gh_c_3001', 'ijk901efg234567ijk901efg234567ijk901efg2', 'refactor: Use query builder', 'perform-api', 'refactor/queries', 180, 200, 8, NOW() - INTERVAL '4 days', 'https://github.com/org/perform-api/commit/ijk901', 'd3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  ('c3333333-3333-3333-3333-333333333332', 'gh_c_3002', 'jkl012fgh345678jkl012fgh345678jkl012fgh3', 'refactor: Add eager loading', 'perform-api', 'refactor/queries', 140, 80, 4, NOW() - INTERVAL '3 days', 'https://github.com/org/perform-api/commit/jkl012', 'd3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  
  -- Commits de Lucas Ferreira
  ('c5555555-5555-5555-5555-555555555551', 'gh_c_5001', 'klm123ghi456789klm123ghi456789klm123ghi4', 'feat: Add mobile menu', 'perform-front', 'feature/responsive', 220, 90, 10, NOW() - INTERVAL '1 day', 'https://github.com/org/perform-front/commit/klm123', 'd5555555-5555-5555-5555-555555555555', NOW(), NOW()),
  ('c5555555-5555-5555-5555-555555555552', 'gh_c_5002', 'lmn234hij567890lmn234hij567890lmn234hij5', 'feat: Add touch gestures', 'perform-front', 'feature/responsive', 200, 90, 8, NOW() - INTERVAL '12 hours', 'https://github.com/org/perform-front/commit/lmn234', 'd5555555-5555-5555-5555-555555555555', NOW(), NOW()),
  
  -- Commits de Rafael Lima
  ('c7777777-7777-7777-7777-777777777771', 'gh_c_7001', 'mno345ijk678901mno345ijk678901mno345ijk6', 'feat: Add GitHub Actions workflow', 'perform-api', 'feature/cicd', 150, 0, 4, NOW() - INTERVAL '2 days', 'https://github.com/org/perform-api/commit/mno345', 'd7777777-7777-7777-7777-777777777777', NOW(), NOW()),
  ('c7777777-7777-7777-7777-777777777772', 'gh_c_7002', 'nop456jkl789012nop456jkl789012nop456jkl7', 'feat: Add Docker compose', 'perform-api', 'feature/cicd', 100, 0, 4, NOW() - INTERVAL '1 day', 'https://github.com/org/perform-api/commit/nop456', 'd7777777-7777-7777-7777-777777777777', NOW(), NOW())
ON CONFLICT (github_id) DO UPDATE SET
  message = EXCLUDED.message,
  updated_at = NOW();

-- =====================================================
-- 6. CRIAR CODE REVIEWS
-- =====================================================
INSERT INTO code_reviews (id, github_id, status, body, submitted_at, comments_count, "reviewerId", "pullRequestId", created_at, updated_at)
VALUES 
  -- Reviews no PR de auth
  ('aa111111-1111-1111-1111-111111111111', 'gh_r_1001', 'approved', 'LGTM! Ótima implementação do JWT. Apenas uma sugestão: considere adicionar refresh tokens.', NOW() - INTERVAL '5 days', 3, 'd2222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('aa111111-1111-1111-1111-111111111112', 'gh_r_1002', 'approved', 'Aprovado! Código bem estruturado e testado.', NOW() - INTERVAL '5 days', 1, 'd3333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', NOW(), NOW()),
  
  -- Reviews no PR de memory leak
  ('aa222222-2222-2222-2222-222222222221', 'gh_r_2001', 'changes_requested', 'Por favor, adicione testes unitários para a nova lógica de cache.', NOW() - INTERVAL '5 days', 2, 'd1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('aa222222-2222-2222-2222-222222222222', 'gh_r_2002', 'approved', 'Testes adicionados. Aprovado!', NOW() - INTERVAL '4 days', 1, 'd1111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222', NOW(), NOW()),
  
  -- Reviews no PR de dashboard
  ('aa333333-3333-3333-3333-333333333331', 'gh_r_3001', 'commented', 'Sugestão: podemos adicionar animações nos gráficos?', NOW() - INTERVAL '4 days', 2, 'd5555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', NOW(), NOW()),
  ('aa333333-3333-3333-3333-333333333332', 'gh_r_3002', 'approved', 'Ficou excelente! UI muito bem feita.', NOW() - INTERVAL '3 days', 1, 'd6666666-6666-6666-6666-666666666666', '33333333-3333-3333-3333-333333333333', NOW(), NOW()),
  
  -- Reviews no PR de queries
  ('aa444444-4444-4444-4444-444444444441', 'gh_r_4001', 'approved', 'Ótima otimização! Reduziu o tempo de resposta em 60%.', NOW() - INTERVAL '2 days', 2, 'd2222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', NOW(), NOW()),
  
  -- Reviews nos PRs abertos
  ('aa555555-5555-5555-5555-555555555551', 'gh_r_5001', 'commented', 'Podemos adicionar cache para os artifacts do build?', NOW() - INTERVAL '1 day', 3, 'd8888888-8888-8888-8888-888888888888', '55555555-5555-5555-5555-555555555555', NOW(), NOW()),
  ('aa666666-6666-6666-6666-666666666661', 'gh_r_6001', 'pending', NULL, NOW() - INTERVAL '12 hours', 0, 'd4444444-4444-4444-4444-444444444444', '66666666-6666-6666-6666-666666666666', NOW(), NOW())
ON CONFLICT (github_id) DO UPDATE SET
  status = EXCLUDED.status,
  body = EXCLUDED.body,
  updated_at = NOW();

-- =====================================================
-- 7. CRIAR METRICS (últimos 30 dias)
-- =====================================================
INSERT INTO metrics (id, name, value, period_start, period_end, metadata, "developerId", created_at, updated_at)
VALUES 
  -- Métricas de Carlos Silva
  ('a1111111-1111-1111-1111-111111111111', 'commits_count', 45, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111112', 'lines_added', 2850, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111113', 'pull_requests_merged', 8, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111114', 'code_reviews_given', 12, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"avg_time_to_review": "4h"}', 'd1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  ('a1111111-1111-1111-1111-111111111115', 'avg_pr_time_hours', 18.5, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NULL, 'd1111111-1111-1111-1111-111111111111', NOW(), NOW()),
  
  -- Métricas de Ana Santos
  ('a2222222-2222-2222-2222-222222222221', 'commits_count', 38, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222222', 'lines_added', 1950, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222223', 'pull_requests_merged', 6, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222224', 'code_reviews_given', 15, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"avg_time_to_review": "3h"}', 'd2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  ('a2222222-2222-2222-2222-222222222225', 'avg_pr_time_hours', 22.3, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NULL, 'd2222222-2222-2222-2222-222222222222', NOW(), NOW()),
  
  -- Métricas de Pedro Oliveira
  ('a3333333-3333-3333-3333-333333333331', 'commits_count', 52, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333332', 'lines_added', 3200, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333333', 'pull_requests_merged', 10, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333334', 'code_reviews_given', 8, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"avg_time_to_review": "6h"}', 'd3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  ('a3333333-3333-3333-3333-333333333335', 'avg_pr_time_hours', 14.2, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NULL, 'd3333333-3333-3333-3333-333333333333', NOW(), NOW()),
  
  -- Métricas de Mariana Costa
  ('a4444444-4444-4444-4444-444444444441', 'commits_count', 62, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-front"}', 'd4444444-4444-4444-4444-444444444444', NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444442', 'lines_added', 4500, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-front"}', 'd4444444-4444-4444-4444-444444444444', NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444443', 'pull_requests_merged', 12, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-front"}', 'd4444444-4444-4444-4444-444444444444', NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444444', 'code_reviews_given', 18, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"avg_time_to_review": "2h"}', 'd4444444-4444-4444-4444-444444444444', NOW(), NOW()),
  ('a4444444-4444-4444-4444-444444444445', 'avg_pr_time_hours', 12.8, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NULL, 'd4444444-4444-4444-4444-444444444444', NOW(), NOW()),
  
  -- Métricas de Lucas Ferreira
  ('a5555555-5555-5555-5555-555555555551', 'commits_count', 48, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-front"}', 'd5555555-5555-5555-5555-555555555555', NOW(), NOW()),
  ('a5555555-5555-5555-5555-555555555552', 'lines_added', 3100, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-front"}', 'd5555555-5555-5555-5555-555555555555', NOW(), NOW()),
  ('a5555555-5555-5555-5555-555555555553', 'pull_requests_merged', 9, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-front"}', 'd5555555-5555-5555-5555-555555555555', NOW(), NOW()),
  ('a5555555-5555-5555-5555-555555555554', 'code_reviews_given', 14, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"avg_time_to_review": "3.5h"}', 'd5555555-5555-5555-5555-555555555555', NOW(), NOW()),
  ('a5555555-5555-5555-5555-555555555555', 'avg_pr_time_hours', 16.4, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NULL, 'd5555555-5555-5555-5555-555555555555', NOW(), NOW()),
  
  -- Métricas de Julia Almeida
  ('a6666666-6666-6666-6666-666666666661', 'commits_count', 35, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-front"}', 'd6666666-6666-6666-6666-666666666666', NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666662', 'lines_added', 2200, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-front"}', 'd6666666-6666-6666-6666-666666666666', NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666663', 'pull_requests_merged', 7, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-front"}', 'd6666666-6666-6666-6666-666666666666', NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666664', 'code_reviews_given', 20, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"avg_time_to_review": "1.5h"}', 'd6666666-6666-6666-6666-666666666666', NOW(), NOW()),
  ('a6666666-6666-6666-6666-666666666665', 'avg_pr_time_hours', 20.1, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NULL, 'd6666666-6666-6666-6666-666666666666', NOW(), NOW()),
  
  -- Métricas de Rafael Lima
  ('a7777777-7777-7777-7777-777777777771', 'commits_count', 28, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd7777777-7777-7777-7777-777777777777', NOW(), NOW()),
  ('a7777777-7777-7777-7777-777777777772', 'lines_added', 1500, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd7777777-7777-7777-7777-777777777777', NOW(), NOW()),
  ('a7777777-7777-7777-7777-777777777773', 'pull_requests_merged', 5, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd7777777-7777-7777-7777-777777777777', NOW(), NOW()),
  ('a7777777-7777-7777-7777-777777777774', 'code_reviews_given', 6, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"avg_time_to_review": "8h"}', 'd7777777-7777-7777-7777-777777777777', NOW(), NOW()),
  ('a7777777-7777-7777-7777-777777777775', 'avg_pr_time_hours', 28.6, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NULL, 'd7777777-7777-7777-7777-777777777777', NOW(), NOW()),
  
  -- Métricas de Fernanda Rocha
  ('a8888888-8888-8888-8888-888888888881', 'commits_count', 32, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd8888888-8888-8888-8888-888888888888', NOW(), NOW()),
  ('a8888888-8888-8888-8888-888888888882', 'lines_added', 1800, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd8888888-8888-8888-8888-888888888888', NOW(), NOW()),
  ('a8888888-8888-8888-8888-888888888883', 'pull_requests_merged', 6, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"repository": "perform-api"}', 'd8888888-8888-8888-8888-888888888888', NOW(), NOW()),
  ('a8888888-8888-8888-8888-888888888884', 'code_reviews_given', 10, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '{"avg_time_to_review": "5h"}', 'd8888888-8888-8888-8888-888888888888', NOW(), NOW()),
  ('a8888888-8888-8888-8888-888888888885', 'avg_pr_time_hours', 24.2, CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, NULL, 'd8888888-8888-8888-8888-888888888888', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. CONFIGURAR INTEGRAÇÃO GITHUB DA BANCA
-- =====================================================
INSERT INTO github_configurations (
  id,
  created_at,
  updated_at,
  deleted_at,
  user_id,
  github_token,
  github_username,
  github_user_id,
  data_range,
  is_active
)
VALUES (
  'aa000000-0000-0000-0000-000000000001',
  NOW(),
  NOW(),
  NULL,
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'gho_example_personal_token_for_tests_123',
  'banca-senac',
  '987654321',
  3,
  true
)
ON CONFLICT (id) DO UPDATE SET
  github_token = EXCLUDED.github_token,
  github_username = EXCLUDED.github_username,
  github_user_id = EXCLUDED.github_user_id,
  updated_at = NOW();

INSERT INTO monitored_repositories (
  id,
  configuration_id,
  repo_id,
  repo_name,
  repo_full_name,
  description,
  is_private,
  webhook_id,
  is_active,
  created_at
)
VALUES
  ('aa000000-0000-0000-0000-000000000101', 'aa000000-0000-0000-0000-000000000001', '785412369', 'perform-api', 'senac-perform/perform-api', 'API oficial do Perform', false, NULL, true, NOW()),
  ('aa000000-0000-0000-0000-000000000102', 'aa000000-0000-0000-0000-000000000001', '785412370', 'perform-front', 'senac-perform/perform-front', 'Frontend e desktop app do Perform', false, NULL, true, NOW())
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 9. POPULAR GITHUB_PULL_REQUESTS
-- =====================================================
INSERT INTO github_pull_requests (
  id,
  created_at,
  updated_at,
  deleted_at,
  repository_id,
  developer_id,
  pr_number,
  title,
  body,
  state,
  author_login,
  author_email,
  pr_created_at,
  pr_updated_at,
  closed_at,
  merged_at,
  additions,
  deletions,
  changed_files,
  commits_count,
  comments_count,
  review_comments_count,
  html_url,
  base_branch,
  head_branch
)
VALUES
  ('aa000000-0000-0000-0000-000000001001', NOW() - INTERVAL '14 days', NOW() - INTERVAL '13 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd1111111-1111-1111-1111-111111111111', 210, 'feat: Introduce squad OKRs', 'Adiciona endpoints para monitorar OKRs por squad', 'merged', 'carlos-silva', 'carlos.silva@empresa.com', NOW() - INTERVAL '15 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', 520, 80, 18, 6, 12, 4, 'https://github.com/senac-perform/perform-api/pull/210', 'main', 'feature/squad-okrs'),
  ('aa000000-0000-0000-0000-000000001002', NOW() - INTERVAL '11 days', NOW() - INTERVAL '9 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd2222222-2222-2222-2222-222222222222', 211, 'fix: Stabilize cache worker', 'Cria watchdog para reinício automático do worker', 'closed', 'ana-santos', 'ana.santos@empresa.com', NOW() - INTERVAL '12 days', NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days', NULL, 230, 310, 11, 4, 5, 2, 'https://github.com/senac-perform/perform-api/pull/211', 'main', 'fix/cache-worker'),
  ('aa000000-0000-0000-0000-000000001003', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd3333333-3333-3333-3333-333333333333', 212, 'refactor: Repository pattern', 'Refatora módulo de relatórios para repository pattern', 'merged', 'pedro-oliveira', 'pedro.oliveira@empresa.com', NOW() - INTERVAL '9 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days', 300, 260, 9, 5, 3, 1, 'https://github.com/senac-perform/perform-api/pull/212', 'main', 'refactor/reports-repo'),
  ('aa000000-0000-0000-0000-000000001004', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days', NULL, 'aa000000-0000-0000-0000-000000000102', 'd4444444-4444-4444-4444-444444444444', 145, 'feat: Dashboard dark mode polish', 'Melhora microinterações e acessibilidade do dashboard', 'merged', 'mariana-costa', 'mariana.costa@empresa.com', NOW() - INTERVAL '7 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', 610, 120, 24, 7, 6, 2, 'https://github.com/senac-perform/perform-front/pull/145', 'main', 'feature/dark-mode-v2'),
  ('aa000000-0000-0000-0000-000000001005', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', NULL, 'aa000000-0000-0000-0000-000000000102', 'd5555555-5555-5555-5555-555555555555', 146, 'feat: Offline insights cache', 'Adiciona cache local e sync progressivo no desktop', 'open', 'lucas-ferreira', 'lucas.ferreira@empresa.com', NOW() - INTERVAL '4 days', NOW() - INTERVAL '2 days', NULL, NULL, 340, 90, 13, 4, 2, 1, 'https://github.com/senac-perform/perform-front/pull/146', 'main', 'feature/offline-cache'),
  ('aa000000-0000-0000-0000-000000001006', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd7777777-7777-7777-7777-777777777777', 213, 'chore: GitHub Actions matrix build', 'Build matrix para Windows/Linux, incluindo testes E2E', 'open', 'rafael-lima', 'rafael.lima@empresa.com', NOW() - INTERVAL '3 days', NOW() - INTERVAL '1 days', NULL, NULL, 180, 40, 7, 3, 1, 0, 'https://github.com/senac-perform/perform-api/pull/213', 'main', 'chore/actions-matrix')
ON CONFLICT (repository_id, pr_number) DO UPDATE SET
  state = EXCLUDED.state,
  pr_updated_at = EXCLUDED.pr_updated_at,
  merged_at = COALESCE(EXCLUDED.merged_at, github_pull_requests.merged_at),
  closed_at = COALESCE(EXCLUDED.closed_at, github_pull_requests.closed_at);

-- =====================================================
-- 10. POPULAR GITHUB_COMMITS
-- =====================================================
INSERT INTO github_commits (
  id,
  created_at,
  updated_at,
  deleted_at,
  repository_id,
  developer_id,
  commit_sha,
  message,
  author_name,
  author_email,
  committed_date,
  additions,
  deletions,
  changed_files,
  branch,
  html_url
)
VALUES
  ('aa000000-0000-0000-0000-000000002001', NOW() - INTERVAL '15 days', NOW() - INTERVAL '15 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd1111111-1111-1111-1111-111111111111', 'okrs123abc456def7890001', 'feat: add objectives endpoints', 'Carlos Silva', 'carlos.silva@empresa.com', NOW() - INTERVAL '15 days', 320, 40, 10, 'feature/squad-okrs', 'https://github.com/senac-perform/perform-api/commit/okrs123'),
  ('aa000000-0000-0000-0000-000000002002', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd1111111-1111-1111-1111-111111111111', 'okrs123abc456def7890002', 'tests: cover okr service', 'Carlos Silva', 'carlos.silva@empresa.com', NOW() - INTERVAL '14 days', 120, 0, 4, 'feature/squad-okrs', 'https://github.com/senac-perform/perform-api/commit/okrs124'),
  ('aa000000-0000-0000-0000-000000002003', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd2222222-2222-2222-2222-222222222222', 'cachefix123abc456', 'fix: worker watchdog timer', 'Ana Santos', 'ana.santos@empresa.com', NOW() - INTERVAL '6 days', 80, 150, 6, 'fix/cache-worker', 'https://github.com/senac-perform/perform-api/commit/cachefix123'),
  ('aa000000-0000-0000-0000-000000002004', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd3333333-3333-3333-3333-333333333333', 'reportrefactor123', 'refactor: split mappers', 'Pedro Oliveira', 'pedro.oliveira@empresa.com', NOW() - INTERVAL '5 days', 150, 120, 5, 'refactor/reports-repo', 'https://github.com/senac-perform/perform-api/commit/reportrefactor123'),
  ('aa000000-0000-0000-0000-000000002005', NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days', NULL, 'aa000000-0000-0000-0000-000000000102', 'd4444444-4444-4444-4444-444444444444', 'dashpolish123abc', 'feat: skeleton loading states', 'Mariana Costa', 'mariana.costa@empresa.com', NOW() - INTERVAL '4 days', 260, 40, 9, 'feature/dark-mode-v2', 'https://github.com/senac-perform/perform-front/commit/dashpolish123'),
  ('aa000000-0000-0000-0000-000000002006', NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days', NULL, 'aa000000-0000-0000-0000-000000000102', 'd5555555-5555-5555-5555-555555555555', 'offlinecache123abc', 'feat: add sqlite sync queue', 'Lucas Ferreira', 'lucas.ferreira@empresa.com', NOW() - INTERVAL '3 days', 210, 70, 8, 'feature/offline-cache', 'https://github.com/senac-perform/perform-front/commit/offcache123'),
  ('aa000000-0000-0000-0000-000000002007', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd7777777-7777-7777-7777-777777777777', 'actions123matrix456', 'ci: add windows job', 'Rafael Lima', 'rafael.lima@empresa.com', NOW() - INTERVAL '2 days', 120, 20, 4, 'chore/actions-matrix', 'https://github.com/senac-perform/perform-api/commit/actions123'),
  ('aa000000-0000-0000-0000-000000002008', NOW() - INTERVAL '1 days', NOW() - INTERVAL '1 days', NULL, 'aa000000-0000-0000-0000-000000000101', 'd7777777-7777-7777-7777-777777777777', 'actions123matrix789', 'ci: cache pnpm downloads', 'Rafael Lima', 'rafael.lima@empresa.com', NOW() - INTERVAL '1 days', 60, 10, 3, 'chore/actions-matrix', 'https://github.com/senac-perform/perform-api/commit/actions124')
ON CONFLICT (repository_id, commit_sha) DO UPDATE SET
  message = EXCLUDED.message,
  committed_date = EXCLUDED.committed_date,
  additions = EXCLUDED.additions,
  deletions = EXCLUDED.deletions,
  changed_files = EXCLUDED.changed_files;

-- =====================================================
-- 11. POPULAR GITHUB_PR_REVIEWS
-- =====================================================
INSERT INTO github_pr_reviews (
  id,
  created_at,
  updated_at,
  deleted_at,
  pull_request_id,
  developer_id,
  review_id,
  reviewer_login,
  reviewer_email,
  state,
  body,
  submitted_at,
  html_url
)
VALUES
  ('aa000000-0000-0000-0000-000000003001', NOW() - INTERVAL '14 days', NOW() - INTERVAL '14 days', NULL, 'aa000000-0000-0000-0000-000000001001', 'd2222222-2222-2222-2222-222222222222', '900000001', 'ana-santos', 'ana.santos@empresa.com', 'APPROVED', 'Excelente! Apenas monitore os limites de paginação.', NOW() - INTERVAL '14 days', 'https://github.com/senac-perform/perform-api/pull/210#pullrequestreview-900000001'),
  ('aa000000-0000-0000-0000-000000003002', NOW() - INTERVAL '13 days', NOW() - INTERVAL '13 days', NULL, 'aa000000-0000-0000-0000-000000001001', 'd3333333-3333-3333-3333-333333333333', '900000002', 'pedro-oliveira', 'pedro.oliveira@empresa.com', 'COMMENTED', 'Podemos quebrar o DTO em versões v1/v2?', NOW() - INTERVAL '13 days', 'https://github.com/senac-perform/perform-api/pull/210#pullrequestreview-900000002'),
  ('aa000000-0000-0000-0000-000000003003', NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days', NULL, 'aa000000-0000-0000-0000-000000001002', 'd1111111-1111-1111-1111-111111111111', '900000003', 'carlos-silva', 'carlos.silva@empresa.com', 'CHANGES_REQUESTED', 'Adicionar métricas no Prometheus quando o worker reiniciar.', NOW() - INTERVAL '6 days', 'https://github.com/senac-perform/perform-api/pull/211#pullrequestreview-900000003'),
  ('aa000000-0000-0000-0000-000000003004', NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days', NULL, 'aa000000-0000-0000-0000-000000001004', 'd6666666-6666-6666-6666-666666666666', '900000004', 'julia-almeida', 'julia.almeida@empresa.com', 'APPROVED', 'UI impecável! Adorei o foco em acessibilidade.', NOW() - INTERVAL '5 days', 'https://github.com/senac-perform/perform-front/pull/145#pullrequestreview-900000004'),
  ('aa000000-0000-0000-0000-000000003005', NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days', NULL, 'aa000000-0000-0000-0000-000000001005', 'd8888888-8888-8888-8888-888888888888', '900000005', 'fernanda-rocha', 'fernanda.rocha@empresa.com', 'COMMENTED', 'Lembre de liberar storage quando sincronizar.', NOW() - INTERVAL '2 days', 'https://github.com/senac-perform/perform-front/pull/146#pullrequestreview-900000005')
ON CONFLICT (pull_request_id, review_id) DO UPDATE SET
  state = EXCLUDED.state,
  body = EXCLUDED.body,
  submitted_at = EXCLUDED.submitted_at,
  html_url = EXCLUDED.html_url;

-- =====================================================
-- 12. VINCULAR USUÁRIO AO SQUAD (como tech lead)
-- =====================================================
UPDATE squads SET "techLeadId" = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' WHERE id = 'b1111111-1111-1111-1111-111111111111';
UPDATE users SET "squadId" = 'b1111111-1111-1111-1111-111111111111' WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- =====================================================
-- RESUMO DOS DADOS CRIADOS
-- =====================================================
-- Usuário: banca@senac.com (Senha: Senac@2025) - Role: Admin
-- 3 Squads: Backend Team, Frontend Team, DevOps Team
-- 8 Developers distribuídos nos squads
-- 7 Pull Requests + 6 GitHub Pull Requests
-- 15 Commits + 8 GitHub Commits
-- 9 Code Reviews + 5 GitHub Reviews
-- 40 Metrics (5 por developer)
-- GitHub configuration + 2 repositories monitorados
-- =====================================================

SELECT 'Dados de teste inseridos com sucesso!' as status;
SELECT 'Login: banca@senac.com | Senha: Senac@2025' as credenciais;
