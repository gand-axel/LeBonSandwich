define({ "api": [
  {
    "type": "get",
    "url": "/sandwichs",
    "title": "Requête pour avoir la liste de tous les sandwichs",
    "name": "GetSandwichs",
    "group": "Catalogue",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "type",
            "description": "<p>Type de la réponse</p>"
          }
        ]
      }
    },
    "error": {
      "examples": [
        {
          "title": "Get Error",
          "content": "HTTP/1.1 500 Internal Server Error",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./catalogue_dev/server.js",
    "groupTitle": "Catalogue"
  },
  {
    "type": "get",
    "url": "/commands",
    "title": "Requête pour avoir la liste de toutes les commandes",
    "name": "GetCommands",
    "group": "Commande",
    "success": {
      "fields": {
        "Success 200": [
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "type",
            "description": "<p>Type de la réponse.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "count",
            "description": "<p>Nombre de résultats.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "size",
            "description": "<p>Nombre de commandes retournées.</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "links",
            "description": "<p>Liste des liens des pages des résultats.</p>"
          },
          {
            "group": "Success 200",
            "type": "Link",
            "optional": false,
            "field": "links.next",
            "description": "<p>Lien de la page suivante des résultats.</p>"
          },
          {
            "group": "Success 200",
            "type": "Link",
            "optional": false,
            "field": "links.prev",
            "description": "<p>Lien de la page précédente des résultats.</p>"
          },
          {
            "group": "Success 200",
            "type": "Link",
            "optional": false,
            "field": "links.last",
            "description": "<p>Lien de la dernière page des résultats.</p>"
          },
          {
            "group": "Success 200",
            "type": "Link",
            "optional": false,
            "field": "links.first",
            "description": "<p>Lien de la première page des résultats.</p>"
          },
          {
            "group": "Success 200",
            "type": "Objetc",
            "optional": false,
            "field": "commands",
            "description": "<p>Listes des commandes.</p>"
          },
          {
            "group": "Success 200",
            "type": "Objetc",
            "optional": false,
            "field": "commands.command",
            "description": "<p>Détail d'une commande.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "commands.command.id",
            "description": "<p>ID de la commande.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "commands.command.nom",
            "description": "<p>Nom de la commande.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "commands.command.created_at",
            "description": "<p>Date de création de la commande.</p>"
          },
          {
            "group": "Success 200",
            "type": "String",
            "optional": false,
            "field": "commands.command.livraison",
            "description": "<p>Date de livraison de la commande.</p>"
          },
          {
            "group": "Success 200",
            "type": "Number",
            "optional": false,
            "field": "commands.command.status",
            "description": "<p>Status de la commande.</p>"
          },
          {
            "group": "Success 200",
            "type": "Object",
            "optional": false,
            "field": "commands.links",
            "description": "<p>Liens vers les ressources associés à la commande.</p>"
          },
          {
            "group": "Success 200",
            "type": "Link",
            "optional": false,
            "field": "commands.links.self",
            "description": "<p>Lien pour avoir des informations sur la commande.</p>"
          }
        ]
      },
      "examples": [
        {
          "title": "Success-Response:",
          "content": "{\n  \"type\": \"collection\",\n  \"count\": 1510,\n  \"size\": 10,\n  \"links\": {\n     \"next\": {\n         \"href\": \"/commands/?page=2&size=10\"\n     },\n     \"prev\": {\n         \"href\": \"/commands/?page=1&size=10\"\n     },\n     \"last\": {\n         \"href\": \"/commands/?page=151&size=10\"\n     },\n     \"first\": {\n         \"href\": \"/commands/?page=1&size=10\"\n     }\n  },\n  \"commands\": [\n     {\n         \"command\": {\n             \"id\": \"18d247f1-51b9-4655-93f1-e5124539d8b9\",\n             \"nom\": \"Lopez\",\n             \"created_at\": \"2019-11-08T13:49:40.000Z\",\n             \"livraison\": \"2019-11-08T13:50:17.000Z\",\n             \"status\": 2\n         },\n         \"links\": {\n             \"self\": {\n                 \"href\": \"/commands/18d247f1-51b9-4655-93f1-e5124539d8b9/\"\n             }\n         }\n     }\n  ]\n}",
          "type": "json"
        }
      ]
    },
    "version": "0.0.0",
    "filename": "./commande_dev/server.js",
    "groupTitle": "Commande"
  }
] });
