import { TestBed } from '@angular/core/testing';
import { TreeNode } from 'primeng/api';
import { BracketService } from './bracket.service';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface MatchData {
  title: string;
  pair1: string;
  pair2: string;
}

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
  // -------------------------------------------------------------------------

  describe('buildBracketData(8)', () => {
    let result: TreeNode<MatchData>[];
    let finale: TreeNode<MatchData>;

    beforeEach(() => {
      result = service.buildBracketData(8);
      finale = result[0];
    });

    it('should return an array with a single root node', () => {
      expect(result.length).toBe(1);
    });

    it('should set the root node title to "Finale"', () => {
      expect(finale.data?.['title']).toBe('Finale');
    });

    it('should have 2 demi-finale children at depth 1', () => {
      const demies = nodesAtDepth(finale, 1);
      expect(demies.length).toBe(2);
      expect(demies[0].data?.['title']).toBe('Demie #1');
      expect(demies[1].data?.['title']).toBe('Demie #2');
    });

    it('should have 4 quart-de-finale children at depth 2', () => {
      const quarts = nodesAtDepth(finale, 2);
      expect(quarts.length).toBe(4);
      expect(quarts[0].data?.['title']).toBe('Quart #1');
      expect(quarts[3].data?.['title']).toBe('Quart #4');
    });

    it('should not have huitième nodes (quarts have no children)', () => {
      const quarts = nodesAtDepth(finale, 2);
      for (const quart of quarts) {
        expect((quart.children ?? []).length).toBe(0);
      }
    });

    it('should not include any 1/16ème nodes', () => {
      const all = collectAllNodes(result);
      const seiziemes = all.filter((n) => n.data?.['title'].startsWith('1/16ème'));
      expect(seiziemes.length).toBe(0);
    });

    it('should not include any 1/8ème nodes', () => {
      const all = collectAllNodes(result);
      const huitiemes = all.filter((n) => n.data?.['title'].startsWith('1/8ème'));
      expect(huitiemes.length).toBe(0);
    });

    it('should set pair1 and pair2 to "---" on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.data?.['pair1']).toBe('---');
        expect(node.data?.['pair2']).toBe('---');
      }
    });

    it('should set expanded to true on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.expanded).toBeTrue();
      }
    });

    it('should set type to "match" on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.type).toBe('match');
      }
    });

    it('should produce a total of 7 nodes (1 finale + 2 demies + 4 quarts)', () => {
      const all = collectAllNodes(result);
      expect(all.length).toBe(7);
    });
  });

  // -------------------------------------------------------------------------
  // buildBracketData(16)
  // -------------------------------------------------------------------------

  describe('buildBracketData(16)', () => {
    let result: TreeNode<MatchData>[];
    let finale: TreeNode<MatchData>;

    beforeEach(() => {
      result = service.buildBracketData(16);
      finale = result[0];
    });

    it('should return an array with a single root node', () => {
      expect(result.length).toBe(1);
    });

    it('should set the root node title to "Finale"', () => {
      expect(finale.data?.['title']).toBe('Finale');
    });

    it('should have 2 demi-finale children at depth 1', () => {
      const demies = nodesAtDepth(finale, 1);
      expect(demies.length).toBe(2);
    });

    it('should have 4 quart-de-finale nodes at depth 2', () => {
      const quarts = nodesAtDepth(finale, 2);
      expect(quarts.length).toBe(4);
    });

    it('should have 8 huitième-de-finale nodes at depth 3', () => {
      const huitiemes = nodesAtDepth(finale, 3);
      expect(huitiemes.length).toBe(8);
      expect(huitiemes[0].data?.['title']).toBe('1/8ème #1');
      expect(huitiemes[2].data?.['title']).toBe('1/8ème #3');
    });

    it('should not include any 1/16ème nodes', () => {
      const all = collectAllNodes(result);
      const seiziemes = all.filter((n) => n.data?.['title'].startsWith('1/16ème'));
      expect(seiziemes.length).toBe(0);
    });

    it('should not have children on huitième nodes', () => {
      const huitiemes = nodesAtDepth(finale, 3);
      for (const h of huitiemes) {
        expect((h.children ?? []).length).toBe(0);
      }
    });

    it('should set pair1 and pair2 to "---" on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.data?.['pair1']).toBe('---');
        expect(node.data?.['pair2']).toBe('---');
      }
    });

    it('should set expanded to true on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.expanded).toBeTrue();
      }
    });

    it('should produce a total of 15 nodes (1 + 2 + 4 + 8)', () => {
      const all = collectAllNodes(result);
      expect(all.length).toBe(15);
    });
  });

  // -------------------------------------------------------------------------
  // buildBracketData(32)
  // -------------------------------------------------------------------------

  describe('buildBracketData(32)', () => {
    let result: TreeNode<MatchData>[];
    let finale: TreeNode<MatchData>;

    beforeEach(() => {
      result = service.buildBracketData(32);
      finale = result[0];
    });

    it('should return an array with a single root node', () => {
      expect(result.length).toBe(1);
    });

    it('should set the root node title to "Finale"', () => {
      expect(finale.data?.['title']).toBe('Finale');
    });

    it('should have 2 demi-finale children at depth 1', () => {
      const demies = nodesAtDepth(finale, 1);
      expect(demies.length).toBe(2);
    });

    it('should have 4 quart-de-finale nodes at depth 2', () => {
      const quarts = nodesAtDepth(finale, 2);
      expect(quarts.length).toBe(4);
    });

    it('should have 8 huitième-de-finale nodes at depth 3', () => {
      const huitiemes = nodesAtDepth(finale, 3);
      expect(huitiemes.length).toBe(8);
    });

    it('should have 16 seizième-de-finale nodes at depth 4', () => {
      const seiziemes = nodesAtDepth(finale, 4);
      expect(seiziemes.length).toBe(16);
      expect(seiziemes[0].data?.['title']).toBe('1/16ème #1');
      expect(seiziemes[15].data?.['title']).toBe('1/16ème #16');
    });

    it('should not have children on seizième nodes', () => {
      const seiziemes = nodesAtDepth(finale, 4);
      for (const s of seiziemes) {
        expect((s.children ?? []).length).toBe(0);
      }
    });

    it('should set pair1 and pair2 to "---" on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.data?.['pair1']).toBe('---');
        expect(node.data?.['pair2']).toBe('---');
      }
    });

    it('should set expanded to true on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.expanded).toBeTrue();
      }
    });

    it('should set type to "match" on all nodes', () => {
      const all = collectAllNodes(result);
      for (const node of all) {
        expect(node.type).toBe('match');
      }
    });

    it('should produce a total of 31 nodes (1 + 2 + 4 + 8 + 16)', () => {
      const all = collectAllNodes(result);
      expect(all.length).toBe(31);
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
    it('should label quart nodes as "Quart #N" with 1-based index', () => {
      const result = service.buildBracketData(8);
      const quarts = nodesAtDepth(result[0], 2);
      expect(quarts.map((n) => n.data?.['title'])).toEqual([
        'Quart #1',
        'Quart #2',
        'Quart #3',
        'Quart #4',
      ]);
    });

    it('should label huitième nodes as "1/8ème #N" with 1-based index', () => {
      const result = service.buildBracketData(16);
      const huitiemes = nodesAtDepth(result[0], 3);
      expect(huitiemes[2].data?.['title']).toBe('1/8ème #3');
    });

    it('should label seizième nodes as "1/16ème #N" with 1-based index', () => {
      const result = service.buildBracketData(32);
      const seiziemes = nodesAtDepth(result[0], 4);
      expect(seiziemes[7].data?.['title']).toBe('1/16ème #8');
    });
  });

  // -------------------------------------------------------------------------
  // Tree parent-child wiring
  // -------------------------------------------------------------------------

  describe('parent-child wiring', () => {
    it('should wire demie children so demie #1 owns quart #1 and quart #2', () => {
      const result = service.buildBracketData(8);
      const finale = result[0];
      const demie1 = (finale.children as TreeNode<MatchData>[])[0];
      const demie1Children = demie1.children as TreeNode<MatchData>[];
      expect(demie1Children[0].data?.['title']).toBe('Quart #1');
      expect(demie1Children[1].data?.['title']).toBe('Quart #2');
    });

    it('should wire demie children so demie #2 owns quart #3 and quart #4', () => {
      const result = service.buildBracketData(8);
      const finale = result[0];
      const demie2 = (finale.children as TreeNode<MatchData>[])[1];
      const demie2Children = demie2.children as TreeNode<MatchData>[];
      expect(demie2Children[0].data?.['title']).toBe('Quart #3');
      expect(demie2Children[1].data?.['title']).toBe('Quart #4');
    });

    it('should wire quart #1 children to huitième #1 and huitième #2 for dim=16', () => {
      const result = service.buildBracketData(16);
      const finale = result[0];
      const demie1 = (finale.children as TreeNode<MatchData>[])[0];
      const quart1 = (demie1.children as TreeNode<MatchData>[])[0];
      const quart1Children = quart1.children as TreeNode<MatchData>[];
      expect(quart1Children[0].data?.['title']).toBe('1/8ème #1');
      expect(quart1Children[1].data?.['title']).toBe('1/8ème #2');
    });
  });
});
