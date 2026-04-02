import { TestBed } from '@angular/core/testing';
import { TreeNode } from 'primeng/api';
import { BracketService } from './bracket.service';
import { MatchData } from '../models/bracket.models';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Collect all nodes in BFS order. */
function collectAllNodes(nodes: TreeNode<MatchData>[]): TreeNode<MatchData>[] {
  const result: TreeNode<MatchData>[] = [];
  const queue: TreeNode<MatchData>[] = [...nodes];
  while (queue.length > 0) {
    const node = queue.shift()!;
    result.push(node);
    if (node.children) {
      queue.push(...node.children);
    }
  }
  return result;
}

/** Return the nodes at a given BFS depth (root = depth 0). */
function nodesAtDepth(root: TreeNode<MatchData>, depth: number): TreeNode<MatchData>[] {
  if (depth === 0) {
    return [root];
  }
  const children = (root.children ?? []) as TreeNode<MatchData>[];
  if (depth === 1) {
    return children;
  }
  return children.flatMap((child) => nodesAtDepth(child, depth - 1));
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('BracketService', () => {
  let service: BracketService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BracketService);
  });

  // -------------------------------------------------------------------------
  // Creation
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('should be created', () => {
      expect(service).toBeTruthy();
    });
  });

  // -------------------------------------------------------------------------
  // buildBracketData(8)
  // Root: "Gagnant" → R2 (×2) → R4 (×4) → R8 (×8) — 15 nodes total
  // -------------------------------------------------------------------------

  describe('buildBracketData(8)', () => {
    let result: TreeNode<MatchData>[];
    let root: TreeNode<MatchData>;

    beforeEach(() => {
      result = service.buildBracketData(8);
      root = result[0];
    });

    it('should return an array with a single root node', () => {
      expect(result.length).toBe(1);
    });

    it('should set the root node title to "Gagnant"', () => {
      expect(root.data?.['title']).toBe('Gagnant');
    });

    it('should have 2 R2 children at depth 1', () => {
      const r2 = nodesAtDepth(root, 1);
      expect(r2.length).toBe(2);
      expect(r2[0].data?.['title']).toBe('R2 #1');
      expect(r2[1].data?.['title']).toBe('R2 #2');
    });

    it('should have 4 R4 nodes at depth 2', () => {
      const r4 = nodesAtDepth(root, 2);
      expect(r4.length).toBe(4);
      expect(r4[0].data?.['title']).toBe('R4 #1');
      expect(r4[3].data?.['title']).toBe('R4 #4');
    });

    it('should have 8 R8 leaf nodes at depth 3', () => {
      const r8 = nodesAtDepth(root, 3);
      expect(r8.length).toBe(8);
      expect(r8[0].data?.['title']).toBe('R8 #1');
      expect(r8[7].data?.['title']).toBe('R8 #8');
    });

    it('should not include any R16 nodes', () => {
      const all = collectAllNodes(result);
      const r16 = all.filter((n) => n.data?.['title'].startsWith('R16'));
      expect(r16.length).toBe(0);
    });

    it('should not have children on R8 leaf nodes', () => {
      const r8 = nodesAtDepth(root, 3);
      for (const node of r8) {
        expect((node.children ?? []).length).toBe(0);
      }
    });

    it('should initialize pair as an empty object on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.data?.pair?.['id']).toBeUndefined();
      }
    });

    it('should set expanded to true on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.expanded).toBeTrue();
      }
    });

    it('should set type to "pair" on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.type).toBe('pair');
      }
    });

    it('should produce a total of 15 nodes (1 + 2 + 4 + 8)', () => {
      const all = collectAllNodes(result);
      expect(all.length).toBe(15);
    });
  });

  // -------------------------------------------------------------------------
  // buildBracketData(16)
  // Root → R2 (×2) → R4 (×4) → R8 (×8) → R16 (×16) — 31 nodes total
  // -------------------------------------------------------------------------

  describe('buildBracketData(16)', () => {
    let result: TreeNode<MatchData>[];
    let root: TreeNode<MatchData>;

    beforeEach(() => {
      result = service.buildBracketData(16);
      root = result[0];
    });

    it('should return an array with a single root node', () => {
      expect(result.length).toBe(1);
    });

    it('should set the root node title to "Gagnant"', () => {
      expect(root.data?.['title']).toBe('Gagnant');
    });

    it('should have 2 R2 children at depth 1', () => {
      const r2 = nodesAtDepth(root, 1);
      expect(r2.length).toBe(2);
    });

    it('should have 4 R4 nodes at depth 2', () => {
      const r4 = nodesAtDepth(root, 2);
      expect(r4.length).toBe(4);
    });

    it('should have 8 R8 nodes at depth 3', () => {
      const r8 = nodesAtDepth(root, 3);
      expect(r8.length).toBe(8);
      expect(r8[0].data?.['title']).toBe('R8 #1');
      expect(r8[2].data?.['title']).toBe('R8 #3');
    });

    it('should have 16 R16 leaf nodes at depth 4', () => {
      const r16 = nodesAtDepth(root, 4);
      expect(r16.length).toBe(16);
      expect(r16[0].data?.['title']).toBe('R16 #1');
    });

    it('should not include any R32 nodes', () => {
      const all = collectAllNodes(result);
      const r32 = all.filter((n) => n.data?.['title'].startsWith('R32'));
      expect(r32.length).toBe(0);
    });

    it('should not have children on R16 leaf nodes', () => {
      const r16 = nodesAtDepth(root, 4);
      for (const h of r16) {
        expect((h.children ?? []).length).toBe(0);
      }
    });

    it('should initialize pair as an empty object on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.data?.pair?.['id']).toBeUndefined();
      }
    });

    it('should set expanded to true on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.expanded).toBeTrue();
      }
    });

    it('should produce a total of 31 nodes (1 + 2 + 4 + 8 + 16)', () => {
      const all = collectAllNodes(result);
      expect(all.length).toBe(31);
    });
  });

  // -------------------------------------------------------------------------
  // buildBracketData(32)
  // Root → R2 (×2) → R4 (×4) → R8 (×8) → R16 (×16) → R32 (×32) — 63 nodes
  // -------------------------------------------------------------------------

  describe('buildBracketData(32)', () => {
    let result: TreeNode<MatchData>[];
    let root: TreeNode<MatchData>;

    beforeEach(() => {
      result = service.buildBracketData(32);
      root = result[0];
    });

    it('should return an array with a single root node', () => {
      expect(result.length).toBe(1);
    });

    it('should set the root node title to "Gagnant"', () => {
      expect(root.data?.['title']).toBe('Gagnant');
    });

    it('should have 2 R2 children at depth 1', () => {
      const r2 = nodesAtDepth(root, 1);
      expect(r2.length).toBe(2);
    });

    it('should have 4 R4 nodes at depth 2', () => {
      const r4 = nodesAtDepth(root, 2);
      expect(r4.length).toBe(4);
    });

    it('should have 8 R8 nodes at depth 3', () => {
      const r8 = nodesAtDepth(root, 3);
      expect(r8.length).toBe(8);
    });

    it('should have 16 R16 nodes at depth 4', () => {
      const r16 = nodesAtDepth(root, 4);
      expect(r16.length).toBe(16);
    });

    it('should have 32 R32 leaf nodes at depth 5', () => {
      const r32 = nodesAtDepth(root, 5);
      expect(r32.length).toBe(32);
      expect(r32[0].data?.['title']).toBe('R32 #1');
      expect(r32[15].data?.['title']).toBe('R32 #16');
    });

    it('should not have children on R32 leaf nodes', () => {
      const r32 = nodesAtDepth(root, 5);
      for (const s of r32) {
        expect((s.children ?? []).length).toBe(0);
      }
    });

    it('should initialize pair as an empty object on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.data?.pair?.['id']).toBeUndefined();
      }
    });

    it('should set expanded to true on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.expanded).toBeTrue();
      }
    });

    it('should set type to "pair" on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.type).toBe('pair');
      }
    });

    it('should produce a total of 63 nodes (1 + 2 + 4 + 8 + 16 + 32)', () => {
      const all = collectAllNodes(result);
      expect(all.length).toBe(63);
    });
  });

  // -------------------------------------------------------------------------
  // getBracketDimensionFromNumberOfPairs
  // -------------------------------------------------------------------------

  describe('getBracketDimensionFromNumberOfPairs', () => {
    it('should return 4 for 4 pairs', () => {
      expect(service.getBracketDimensionFromNumberOfPairs(4)).toBe(4);
    });

    it('should return 4 for 3 pairs', () => {
      expect(service.getBracketDimensionFromNumberOfPairs(3)).toBe(4);
    });

    it('should return 8 for 5 pairs', () => {
      expect(service.getBracketDimensionFromNumberOfPairs(5)).toBe(8);
    });

    it('should return 8 for 8 pairs', () => {
      expect(service.getBracketDimensionFromNumberOfPairs(8)).toBe(8);
    });

    it('should return 16 for 9 pairs', () => {
      expect(service.getBracketDimensionFromNumberOfPairs(9)).toBe(16);
    });

    it('should return 16 for 12 pairs', () => {
      expect(service.getBracketDimensionFromNumberOfPairs(12)).toBe(16);
    });

    it('should return 16 for 16 pairs', () => {
      expect(service.getBracketDimensionFromNumberOfPairs(16)).toBe(16);
    });

    it('should return 32 for 17 pairs', () => {
      expect(service.getBracketDimensionFromNumberOfPairs(17)).toBe(32);
    });

    it('should return 64 for 65 pairs (max fallback)', () => {
      expect(service.getBracketDimensionFromNumberOfPairs(65)).toBe(64);
    });
  });

  // -------------------------------------------------------------------------
  // getNumberOfTopSeedsFromNumberOfPairs
  // -------------------------------------------------------------------------

  describe('getNumberOfTopSeedsFromNumberOfPairs', () => {
    it('should return [2, 3, 4, 5, 6] for 12 pairs', () => {
      expect(service.getAvailableNumberOfTopSeedsFromNumberOfPairs(12)).toEqual([2, 3, 4, 5, 6]);
    });

    it('should return [1, 2] for 8 pairs (min=1, max=4 → [1,2,3,4])', () => {
      expect(service.getAvailableNumberOfTopSeedsFromNumberOfPairs(8)).toEqual([1, 2, 3, 4]);
    });

    it('should return a contiguous range from min to max', () => {
      const result = service.getAvailableNumberOfTopSeedsFromNumberOfPairs(16);
      for (let i = 1; i < result.length; i++) {
        expect(result[i]).toBe(result[i - 1] + 1);
      }
    });

    it('min should be Math.round(nbPairs / 8)', () => {
      const result = service.getAvailableNumberOfTopSeedsFromNumberOfPairs(12);
      expect(result[0]).toBe(Math.round(12 / 8));
    });

    it('max should be Math.round(nbPairs / 2)', () => {
      const result = service.getAvailableNumberOfTopSeedsFromNumberOfPairs(12);
      expect(result[result.length - 1]).toBe(Math.round(12 / 2));
    });
  });

  // -------------------------------------------------------------------------
  // Node titles spot-checks
  // -------------------------------------------------------------------------

  describe('node title formatting', () => {
    it('should label R4 nodes as "R4 #N" with 1-based index', () => {
      const result = service.buildBracketData(8);
      const r4 = nodesAtDepth(result[0], 2);
      expect(r4.map((n) => n.data?.['title'])).toEqual([
        'R4 #1',
        'R4 #2',
        'R4 #3',
        'R4 #4',
      ]);
    });

    it('should label R8 nodes as "R8 #N" with 1-based index', () => {
      const result = service.buildBracketData(16);
      const r8 = nodesAtDepth(result[0], 3);
      expect(r8[2].data?.['title']).toBe('R8 #3');
    });

    it('should label R16 nodes as "R16 #N" with 1-based index', () => {
      const result = service.buildBracketData(32);
      const r16 = nodesAtDepth(result[0], 4);
      expect(r16[7].data?.['title']).toBe('R16 #8');
    });
  });

  // -------------------------------------------------------------------------
  // Tree parent-child wiring
  // -------------------------------------------------------------------------

  describe('parent-child wiring', () => {
    it('should wire R2 #1 children to R4 #1 and R4 #2', () => {
      const result = service.buildBracketData(8);
      const root = result[0];
      const r2_1 = (root.children as TreeNode<MatchData>[])[0];
      const r2_1Children = r2_1.children as TreeNode<MatchData>[];
      expect(r2_1Children[0].data?.['title']).toBe('R4 #1');
      expect(r2_1Children[1].data?.['title']).toBe('R4 #2');
    });

    it('should wire R2 #2 children to R4 #3 and R4 #4', () => {
      const result = service.buildBracketData(8);
      const root = result[0];
      const r2_2 = (root.children as TreeNode<MatchData>[])[1];
      const r2_2Children = r2_2.children as TreeNode<MatchData>[];
      expect(r2_2Children[0].data?.['title']).toBe('R4 #3');
      expect(r2_2Children[1].data?.['title']).toBe('R4 #4');
    });

    it('should wire R4 #1 children to R8 #1 and R8 #2 for dim=16', () => {
      const result = service.buildBracketData(16);
      const root = result[0];
      const r2_1 = (root.children as TreeNode<MatchData>[])[0];
      const r4_1 = (r2_1.children as TreeNode<MatchData>[])[0];
      const r4_1Children = r4_1.children as TreeNode<MatchData>[];
      expect(r4_1Children[0].data?.['title']).toBe('R8 #1');
      expect(r4_1Children[1].data?.['title']).toBe('R8 #2');
    });
  });
});
