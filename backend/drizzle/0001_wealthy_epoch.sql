CREATE TABLE "container_migration_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"container_id" uuid NOT NULL,
	"from_node_id" uuid NOT NULL,
	"to_node_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "node_health" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"node_id" uuid NOT NULL,
	"status" varchar(20) DEFAULT 'healthy' NOT NULL,
	"last_heartbeat" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "type" varchar DEFAULT 'standard';--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "migration_status" varchar DEFAULT 'idle';--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "preferred_cluster_id" uuid;--> statement-breakpoint
ALTER TABLE "containers" ADD COLUMN "last_heartbeat" timestamp;--> statement-breakpoint
ALTER TABLE "container_migration_history" ADD CONSTRAINT "container_migration_history_container_id_containers_id_fk" FOREIGN KEY ("container_id") REFERENCES "public"."containers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "container_migration_history" ADD CONSTRAINT "container_migration_history_from_node_id_nodes_id_fk" FOREIGN KEY ("from_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "container_migration_history" ADD CONSTRAINT "container_migration_history_to_node_id_nodes_id_fk" FOREIGN KEY ("to_node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "node_health" ADD CONSTRAINT "node_health_node_id_nodes_id_fk" FOREIGN KEY ("node_id") REFERENCES "public"."nodes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "containers" ADD CONSTRAINT "containers_preferred_cluster_id_clusters_id_fk" FOREIGN KEY ("preferred_cluster_id") REFERENCES "public"."clusters"("id") ON DELETE no action ON UPDATE no action;