import { define_locale_messages } from '../define_locale_messages'

export const fr_messages = define_locale_messages({
  'app.loading': 'Chargement…',
  'app.tagline': 'Des analytics de PR qui restent sur votre machine',
  'app.settings': 'Paramètres',
  'app.language': 'Langue',
  'app.locale.en': 'English',
  'app.locale.fr': 'Français',

  'onboarding.tagline':
    'Analytics GitHub PR self-hosted. Votre token ne quitte jamais ce navigateur.',
  'onboarding.token_label': 'Personal Access Token GitHub',
  'onboarding.token_placeholder': 'ghp_… ou github_pat_…',
  'onboarding.token_help': 'PAT classique avec accès en lecture {repo} (ou {public_repo}).',
  'onboarding.validate': 'Valider',
  'onboarding.checking': 'Vérification…',
  'onboarding.authenticated_as': 'Authentifié en tant que @{login}',
  'onboarding.rate_limit': '{remaining}/{limit} points GraphQL restants',
  'onboarding.start': 'Commencer l’analyse',
  'onboarding.starting': 'Démarrage…',
  'onboarding.error.no_repos': 'Aucun dépôt trouvé pour ce token.',
  'onboarding.error.invalid_token': 'Token invalide',
  'onboarding.error.save_failed': 'Échec de l’enregistrement des paramètres',

  'sync.syncing': 'Synchronisation…',
  'sync.never': 'Jamais synchronisé',
  'sync.last': 'Dernière sync {relative}',
  'sync.api': 'API {remaining}/{limit}',
  'sync.more_history': 'Plus d’historique disponible',
  'sync.backfilling': 'Backfill…',
  'sync.sync_history': 'Synchroniser l’historique',
  'sync.sync_more': 'Synchroniser plus d’historique',
  'sync.tooltip':
    'Récupère le prochain lot de PRs. Relancez après le reset du rate limit pour aller plus loin dans l’historique.',

  'metrics.empty': 'Pas encore de données. Lancez une sync pour récupérer les pull requests.',

  'dashboard.subtitle': 'Votre dashboard personnalisé',
  'dashboard.subtitle_editing': 'Ajoutez, réordonnez ou retirez des graphiques.',
  'dashboard.customize': 'Personnaliser',
  'dashboard.done': 'Terminé',
  'dashboard.add_chart': 'Ajouter un graphique',
  'dashboard.empty_title': 'Aucun graphique',
  'dashboard.empty_body': 'Choisissez des graphiques préfabriqués pour composer votre dashboard.',
  'dashboard.add_title': 'Ajouter un graphique',
  'dashboard.add_description':
    'Parcourez le catalogue à gauche et prévisualisez le graphique avant de l’ajouter.',
  'dashboard.add_preview': 'Aperçu',
  'dashboard.add_confirm': 'Ajouter au dashboard',
  'dashboard.add_cancel': 'Annuler',
  'dashboard.move_up': 'Monter',
  'dashboard.move_down': 'Descendre',
  'dashboard.remove': 'Retirer {label}',
  'dashboard.default_name': 'Par défaut',
  'dashboard.add_tab': 'Ajouter un dashboard',
  'dashboard.tab_menu': 'Actions du dashboard',
  'dashboard.rename_tab': 'Renommer',
  'dashboard.delete_tab': 'Supprimer',
  'dashboard.rename_title': 'Renommer le dashboard',
  'dashboard.rename_description': 'Choisissez un nouveau nom pour ce dashboard.',
  'dashboard.rename_confirm': 'Enregistrer',
  'dashboard.delete_title': 'Supprimer le dashboard ?',
  'dashboard.delete_description':
    'Cela supprime « {name} » et ses graphiques. Cette action est irréversible.',
  'dashboard.delete_confirm': 'Supprimer',
  'dashboard.delete_disabled': 'Gardez au moins un dashboard',
  'dashboard.create_title': 'Nouveau dashboard',
  'dashboard.create_description': 'Donnez un nom à ce dashboard, puis ajoutez vos graphiques.',
  'dashboard.create_name_label': 'Nom',
  'dashboard.create_name_placeholder': 'ex. Reviewers',
  'dashboard.create_cancel': 'Annuler',
  'dashboard.create_confirm': 'Créer',

  'widget.summary_stats.label': 'Résumé',
  'widget.summary_stats.description':
    'PRs mergées, cycle time, latence de review et taille moyenne.',
  'widget.cycle_time.label': 'Cycle time',
  'widget.cycle_time.description': 'Cycle time moyen par semaine.',
  'widget.throughput.label': 'Throughput',
  'widget.throughput.description': 'PRs mergées par semaine et par auteur.',
  'widget.pr_size.label': 'Taille des PR',
  'widget.pr_size.description': 'Distribution des tailles de PR (XS–XL).',
  'widget.reviewer_load.label': 'Charge de review',
  'widget.reviewer_load.description': 'Reviews données vs reçues par personne.',
  'widget.size_review_insight.label': 'Insight taille vs review',
  'widget.size_review_insight.description': 'Corrélation entre taille de PR et temps de review.',
  'widget.size_vs_review.label': 'Taille vs temps de review',
  'widget.size_vs_review.description': 'Temps de review moyen par bucket de taille.',
  'widget.size_review_scatter.label': 'Nuage taille vs approve',
  'widget.size_review_scatter.description': 'Lignes changées vs demande → approve.',
  'widget.open_prs.label': 'PRs ouvertes',
  'widget.open_prs.description': 'Pull requests ouvertes avec signaux de staleness.',
  'widget.cycle_breakdown.label': 'Découpage du cycle',
  'widget.cycle_breakdown.description':
    'Temps moyen passé à chaque étape de la création au merge, par semaine.',
  'widget.review_latency.label': 'Latence de review',
  'widget.review_latency.description':
    'Temps jusqu’à la 1ʳᵉ review et jusqu’à l’approve, par semaine.',
  'widget.cycle_percentiles.label': 'Percentiles de cycle',
  'widget.cycle_percentiles.description': 'p50 et p95 du cycle time par semaine.',
  'widget.review_rounds.label': 'Tours de review',
  'widget.review_rounds.description': 'Nombre de tours de review nécessaires aux PRs mergées.',
  'widget.no_review_merges.label': 'Merges sans review',
  'widget.no_review_merges.description': 'PRs mergées sans tour de review humain.',
  'widget.author_leaderboard.label': 'Classement auteurs',
  'widget.author_leaderboard.description': 'Volume mergé et moyennes par auteur.',
  'widget.open_pr_age.label': 'Âge des PRs ouvertes',
  'widget.open_pr_age.description': 'Ancienneté des PRs actuellement ouvertes.',
  'widget.flow_volume.label': 'Ouvertes vs mergées',
  'widget.flow_volume.description': 'PRs ouvertes et mergées par semaine.',

  'stats.merged': 'PRs mergées',
  'stats.merged.help':
    'Nombre de pull requests passées à MERGED sur la période, les dépôts et le filtre membres sélectionnés. Les bots ignorés dans les paramètres sont exclus.',
  'stats.cycle_time': 'Cycle time moyen',
  'stats.cycle_time.help':
    'Moyenne d’heures de la création de la PR jusqu’au merge, pour les PRs mergées dans le périmètre. Temps calendaire sauf si les heures ouvrées sont activées.',
  'stats.cycle_time_biz': 'Cycle time moyen (biz)',
  'stats.cycle_time_biz.help':
    'Identique au cycle time moyen, compté uniquement pendant les heures ouvrées configurées (jours et plages dans les paramètres).',
  'stats.tfr': 'Temps jusqu’à 1ʳᵉ review',
  'stats.tfr.help':
    'Moyenne d’heures du début d’attente de review (1ʳᵉ demande de review, sinon ready-for-review, sinon création) jusqu’à la première review humaine. Self-reviews et bots exclus.',
  'stats.tfr_biz': 'Temps jusqu’à 1ʳᵉ review (biz)',
  'stats.tfr_biz.help':
    'Identique au temps jusqu’à 1ʳᵉ review, mesuré en heures ouvrées uniquement.',
  'stats.approve': 'Demande → approve',
  'stats.approve.help':
    'Moyenne d’heures du début d’attente de review jusqu’au premier APPROVED humain, sur les PRs mergées du périmètre.',
  'stats.approve_biz': 'Demande → approve (biz)',
  'stats.approve_biz.help': 'Identique à demande → approve, mesuré en heures ouvrées uniquement.',
  'stats.avg_size': 'Taille moyenne de PR',
  'stats.avg_size.help':
    'Moyenne des additions + suppressions (lignes changées) sur les PRs mergées de la période.',
  'stats.lines': '{count} lignes',

  'chart.help_aria': 'À propos de cette métrique',
  'chart.cycle_time.title': 'Cycle time dans le temps',
  'chart.cycle_time.help':
    'Moyenne hebdomadaire des heures création → merge pour les PRs mergées cette semaine.\n\nAxe Y : heures (ouvrées si activé).\nAxe X : début de semaine (lundi).\n\nUtile pour repérer une régression de vitesse de livraison.',
  'chart.throughput.title': 'Throughput',
  'chart.throughput.help':
    'Nombre de PRs mergées chaque semaine (tous auteurs confondus sur ce graphique).\n\nSeules les PRs MERGED de la période et des filtres sont comptées. Les bots sont exclus.',
  'chart.pr_size.title': 'Distribution des tailles de PR',
  'chart.pr_size.help':
    'Combien de PRs mergées tombent dans chaque bucket de taille (additions + suppressions) :\nXS <50, S 50–199, M 200–499, L 500–999, XL 1000+.\n\nS’il n’y a aucun merge sur la période, le graphique se rabat sur les PRs créées ou mises à jour.',
  'chart.reviewer.title': 'Charge de review',
  'chart.reviewer.help':
    'Pour chaque personne : reviews données (a reviewé la PR de quelqu’un d’autre) vs reviews reçues (d’autres ont reviewé ses PRs) sur la période.\n\nSelf-reviews et bots exclus. Top 20 par activité totale.',
  'chart.size_vs_review.title': 'Temps de review moyen par taille',
  'chart.size_vs_review.help':
    'Pour chaque bucket de taille de PR : moyenne d’heures jusqu’à la 1ʳᵉ review humaine, et moyenne de la demande de review au premier APPROVED.\n\nUniquement les PRs mergées avec les timestamps pertinents.',
  'chart.scatter.title': 'Nuage : lignes vs demande → approve',
  'chart.scatter.help':
    'Chaque point est une PR mergée avec un APPROVED humain.\n\nX : lignes changées. Y : heures du début d’attente de review au premier approve.\n\nLes outliers en haut/à droite sont de grosses PRs et/ou lentes à approve.',
  'chart.open_prs.title': 'Pull requests ouvertes',
  'chart.open_prs.help':
    'PRs actuellement OPEN dans les dépôts/membres sélectionnés (pas limitées à la période).\n\nL’âge part de la création. « Obsolète » = ouverte depuis 7+ jours. Tri du plus ancien au plus récent.',
  'chart.cycle_breakdown.title': 'Découpage du cycle time',
  'chart.cycle_breakdown.help':
    'Moyennes hebdomadaires empilées d’étapes mutuellement exclusives pour les PRs mergées :\n1) Création → demande de review\n2) Demande → 1ʳᵉ review humaine\n3) 1ʳᵉ review → premier approve\n4) Approve → merge\n\nLes étapes sans timestamp sont omises de la moyenne de la semaine.',
  'chart.review_latency.title': 'Latence de review dans le temps',
  'chart.review_latency.help':
    'Deux séries hebdomadaires pour les PRs mergées :\n• Temps jusqu’à 1ʳᵉ review — demande/ready/création → 1ʳᵉ review humaine\n• Demande → approve — même départ → premier APPROVED\n\nDes courbes qui montent indiquent une file de review qui ralentit.',
  'chart.cycle_percentiles.title': 'Percentiles de cycle time',
  'chart.cycle_percentiles.help':
    'p50 (médiane) et p95 hebdomadaires des heures création → merge pour les PRs mergées cette semaine.\n\np50 = PR typique ; p95 = queue lente. Un grand écart signifie que quelques PRs dominent le délai.',
  'chart.review_rounds.title': 'Distribution des tours de review',
  'chart.review_rounds.help':
    'Combien de tours de review ont nécessité les PRs mergées.\n\nTours ≈ événements CHANGES_REQUESTED + 1 s’il y a eu un APPROVED (0 si aucune review humaine). Le bucket « 4+ » regroupe les allers-retours lourds.',
  'chart.no_review_merges.title': 'Merges sans review',
  'chart.no_review_merges.help':
    'Parmi les PRs mergées du périmètre, combien avaient zéro tour de review humaine (aucune review non-auteur, non-bot).\n\nPart = merges sans review ÷ tous les merges de la période.',
  'chart.no_review_merges.count': 'Merges sans review',
  'chart.no_review_merges.ratio': 'Part des merges',
  'chart.no_review_merges.empty': 'Aucune PR mergée sur cette période.',
  'chart.author_leaderboard.title': 'Classement des auteurs',
  'chart.author_leaderboard.help':
    'Top auteurs par nombre de PRs mergées sur la période (max 15).\n\nColonnes : merges, cycle time moyen (création → merge), lignes changées moyennes, tours de review moyens.',
  'chart.author_leaderboard.author': 'Auteur',
  'chart.author_leaderboard.merged': 'Mergées',
  'chart.author_leaderboard.cycle': 'Cycle moy.',
  'chart.author_leaderboard.size': 'Taille moy.',
  'chart.author_leaderboard.rounds': 'Tours moy.',
  'chart.author_leaderboard.empty': 'Aucune PR mergée sur cette période.',
  'chart.open_pr_age.title': 'Âge des PRs ouvertes',
  'chart.open_pr_age.help':
    'Distribution des PRs actuellement OPEN par âge depuis la création : <1j, 1–3j, 3–7j, 7–14j, 14j+.\n\nNon filtré par le contrôle de période — backlog live pour les dépôts/membres sélectionnés.',
  'chart.flow_volume.title': 'Ouvertes vs mergées',
  'chart.flow_volume.help':
    'Comptes hebdomadaires de PRs créées (ouvertes) vs PRs mergées.\n\nOuvertes = created_at ; mergées = merged_at. Si ouvertes restent au-dessus de mergées, le WIP croît.',
  'open_prs.empty': 'Aucune pull request ouverte dans la sélection.',
  'open_prs.stale': 'obsolète',
  'open_prs.meta': '{repo} · @{author} · {lines} lignes',
  'open_prs.prev': 'Précédent',
  'open_prs.next': 'Suivant',
  'open_prs.page': 'Page {page} sur {total}',
  'open_prs.range': '{from}–{to} sur {count}',

  'insight.title': 'La taille des PR ralentit-elle la review ?',
  'insight.help':
    'Corrélation de Pearson entre lignes changées et heures demande → approve sur les PRs mergées ayant les deux valeurs.\n\nr proche de 0 : peu de lien linéaire. r positif : les plus grosses PRs mettent plus longtemps à être approved. Il faut ≥10 échantillons pour une lecture fiable.',
  'insight.metric_approve': 'demande → approve',
  'insight.insufficient': 'Pas assez de données (il faut ≥10 PRs mergées avec taille et {metric}).',
  'insight.strong_pos':
    'Forte corrélation positive (r={r}) : les plus grosses PRs mettent plus longtemps à {metric}.',
  'insight.moderate_pos':
    'Corrélation positive modérée (r={r}) : les plus grosses PRs tendent à prendre plus longtemps à {metric}.',
  'insight.weak':
    'Corrélation linéaire faible / nulle (r={r}) entre lignes changées et temps à {metric}.',
  'insight.negative':
    'Corrélation négative (r={r}) : les plus grosses PRs ne sont pas plus lentes à {metric} dans cet échantillon.',

  'period.7d': '7j',
  'period.30d': '30j',
  'period.90d': '90j',
  'period.custom': 'Perso',

  'settings.title': 'Paramètres',
  'settings.description': 'Token, dépôts, cadence de sync et données locales.',
  'settings.language': 'Langue',
  'settings.save': 'Enregistrer',
  'settings.saving': 'Enregistrement…',
  'settings.save_failed': 'Échec de l’enregistrement',
  'settings.token': 'Token GitHub',
  'settings.repos': 'Dépôts',
  'settings.sync_interval': 'Intervalle de sync (heures)',
  'settings.backfill_limit': 'Taille du lot de backfill',
  'settings.ignored_bots': 'Bots ignorés (un login par ligne)',
  'settings.business_hours': 'Heures ouvrées uniquement',
  'settings.business_hours_help':
    'Ne compter les temps de cycle/review que pendant les fenêtres de travail.',
  'settings.timezone': 'Fuseau horaire',
  'settings.workdays': 'Jours ouvrés',
  'settings.start': 'Début',
  'settings.end': 'Fin',
  'settings.storage': 'Stockage local',
  'settings.reset_sync': 'Effacer les données PR synchronisées',
  'settings.reset_sync_confirm':
    'Effacer toutes les données PR/reviews et relancer un backfill complet ?',
  'settings.reset_sync_done':
    'Données PR locales effacées. La sync fera un backfill au prochain refresh.',
  'settings.clear_all': 'Effacer toutes les données locales',
  'settings.clear_all_confirm':
    'Effacer TOUTES les données locales, y compris le token et les paramètres ?',
})
